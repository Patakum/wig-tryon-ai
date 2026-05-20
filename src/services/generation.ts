import OpenAI, { toFile } from 'openai';
import sharp from 'sharp';
import { prisma } from '@/src/lib/prisma';
import { uploadGeneration } from '@/src/lib/cloudinary-utils';
import { throwApiError } from '@/src/lib/api/errors';
import { getWigOrThrow } from '@/src/services/wig';
import { getPhotoForViewer } from '@/src/services/photo';
import { segmentHair } from '@/src/lib/replicate';
import { buildHairMask, buildGeometricHairMask } from '@/src/lib/mask-utils';

function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throwApiError(
      500,
      'OPENAI_MISCONFIGURED',
      'OpenAI API key not configured. Set OPENAI_API_KEY.',
    );
  }

  return new OpenAI({ apiKey });
}

export async function getGenerationForViewer(
  generationId: string,
  viewerUserId: string | null,
) {
  const generation = await prisma.generation.findUnique({
    where: { id: generationId },
  });

  if (!generation) {
    throwApiError(404, 'NOT_FOUND', 'Generation not found');
  }

  if (generation.userId && generation.userId !== viewerUserId) {
    throwApiError(403, 'FORBIDDEN', 'Forbidden');
  }

  return generation;
}

export async function createFeedbackForGeneration(params: {
  generationId: string;
  userId: string;
  message: string;
}) {
  const generation = await prisma.generation.findUnique({
    where: { id: params.generationId },
    select: { userId: true },
  });

  if (!generation) {
    throwApiError(404, 'NOT_FOUND', 'Generation not found');
  }

  if (generation.userId && generation.userId !== params.userId) {
    throwApiError(403, 'FORBIDDEN', 'Forbidden');
  }

  return prisma.feedback.create({
    data: {
      generationId: params.generationId,
      userId: params.userId,
      message: params.message,
    },
  });
}

export async function createPendingGeneration(params: {
  photoId: string;
  wigId: string;
  viewerUserId: string | null;
}) {
  const [photo] = await Promise.all([
    getPhotoForViewer(params.photoId, params.viewerUserId),
    getWigOrThrow(params.wigId),
  ]);

  const generation = await prisma.generation.create({
    data: {
      userId: photo.userId,
      photoId: params.photoId,
      wigId: params.wigId,
      status: 'pending',
    },
  });

  return { generationId: generation.id };
}

export async function runGeneration(generationId: string): Promise<void> {
  const openai = getOpenAiClient();

  const generation = await prisma.generation.findUnique({
    where: { id: generationId },
  });

  if (!generation) {
    throw new Error(`Generation not found: ${generationId}`);
  }

  const [photo, wig] = await Promise.all([
    prisma.photo.findUnique({ where: { id: generation.photoId } }),
    prisma.wig.findUnique({ where: { id: generation.wigId } }),
  ]);

  if (!photo || !wig) {
    await prisma.generation.update({
      where: { id: generationId },
      data: { status: 'failed' },
    });
    throw new Error('Photo or wig not found for generation');
  }

  try {
    // Run hair segmentation in parallel with image fetching AND pre-build the
    // geometric mask — all three are independent and can run concurrently.
    // Only attempt AI segmentation if REPLICATE_HAIR_SEGMENTATION_MODEL is set.
    const segmentationPromise = process.env.REPLICATE_HAIR_SEGMENTATION_MODEL
      ? segmentHair(photo.imageUrl).catch((err: unknown) => {
          console.warn(
            '[generation] Hair segmentation failed — falling back to geometric mask:',
            err,
          );
          return null;
        })
      : Promise.resolve(null);

    const [selfieResponse, wigResponse, maskUrl, geometricMaskBuffer] =
      await Promise.all([
        fetch(photo.imageUrl),
        fetch(wig.imageUrl),
        segmentationPromise,
        buildGeometricHairMask(1024, 1024),
      ]);

    if (!selfieResponse.ok || !wigResponse.ok) {
      throw new Error('Failed to fetch images for generation.');
    }

    const [selfieBuffer, wigBuffer] = await Promise.all([
      selfieResponse.arrayBuffer(),
      wigResponse.arrayBuffer(),
    ]);

    // Normalize selfie to 1024×1024 in parallel with fetching an AI mask (if any).
    // OpenAI requires mask and image to be the exact same dimensions.
    const [normalizedSelfieBuffer, aiMaskBuffer] = await Promise.all([
      sharp(Buffer.from(selfieBuffer))
        .resize(1024, 1024, { fit: 'cover', position: 'top' })
        .png()
        .toBuffer(),
      maskUrl
        ? buildHairMask(maskUrl, 1024, 1024).catch((err: unknown) => {
            console.warn('[generation] Failed to build AI hair mask:', err);
            return null;
          })
        : Promise.resolve(null),
    ]);

    const chosenMaskBuffer = aiMaskBuffer ?? geometricMaskBuffer;

    // Convert all three inputs to File objects in parallel.
    const [selfieFile, wigFile, maskFile] = await Promise.all([
      toFile(normalizedSelfieBuffer, 'selfie.png', { type: 'image/png' }),
      toFile(Buffer.from(wigBuffer), 'wig.png', { type: 'image/png' }),
      toFile(chosenMaskBuffer, 'mask.png', { type: 'image/png' }),
    ]);

    const prompt = `Replace the hair in the masked area with the hairstyle from the second image.
Keep the face, skin tone, lighting, and identity completely unchanged.
Blend seamlessly. Photorealistic result.`;

    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: [selfieFile, wigFile],
      mask: maskFile,
      prompt,
      quality: 'high',
      size: '1024x1024',
      // jpeg is faster for OpenAI to produce and smaller to upload to Cloudinary
      output_format: 'jpeg',
    });

    const base64 = response.data?.[0]?.b64_json;

    if (!base64) {
      throw new Error('OpenAI returned no image data.');
    }

    const { secureUrl: resultUrl } = await uploadGeneration(
      `data:image/jpeg;base64,${base64}`,
    );

    await prisma.generation.update({
      where: { id: generationId },
      data: {
        resultImageUrl: resultUrl,
        status: 'completed',
      },
    });
  } catch (err) {
    await prisma.generation.update({
      where: { id: generationId },
      data: { status: 'failed' },
    });
    throw err;
  }
}

export async function generateTryOn(params: {
  photoId: string;
  wigId: string;
  viewerUserId: string | null;
}) {
  const { generationId } = await createPendingGeneration(params);
  await runGeneration(generationId);
  return { generationId };
}
