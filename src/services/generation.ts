import OpenAI, { toFile } from 'openai';
import sharp from 'sharp';
import { prisma } from '@/src/lib/prisma';
import { uploadGeneration } from '@/src/lib/cloudinary-utils';
import { throwApiError } from '@/src/lib/api/errors';
import { getWigOrThrow } from '@/src/services/wig';
import { getPhotoForViewer } from '@/src/services/photo';
import { segmentHair } from '@/src/lib/replicate';
import {
  buildCanvasImage,
  buildHairMaskGray,
  compositeHairOntoOriginal,
  computeCanvasLayout,
  orientImage,
  resizeToContent,
  toOpenAiMask,
} from '@/src/lib/mask-utils';
import { requireOwner } from '@/src/services/ownership';
import type { ViewerIdentity } from '@/src/types/viewer';

type GenerationCreationAccess = {
  canCreateGeneration: boolean;
  requiresLoginToGenerateAgain: boolean;
  message: string | null;
};

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
  viewer: ViewerIdentity,
) {
  const generation = await prisma.generation.findUnique({
    where: { id: generationId },
  });

  if (!generation) {
    throwApiError(404, 'NOT_FOUND', 'Generation not found');
  }

  requireOwner(generation, viewer);

  return generation;
}

export async function createFeedbackForGeneration(params: {
  generationId: string;
  userId: string;
  viewer: ViewerIdentity;
  message: string;
}) {
  if (params.viewer.userId !== params.userId) {
    throwApiError(403, 'FORBIDDEN', 'Forbidden');
  }

  const generation = await prisma.generation.findUnique({
    where: { id: params.generationId },
    select: { userId: true, guestSessionId: true },
  });

  if (!generation) {
    throwApiError(404, 'NOT_FOUND', 'Generation not found');
  }

  requireOwner(generation, params.viewer);

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
  viewer: ViewerIdentity;
}) {
  const [photo] = await Promise.all([
    getPhotoForViewer(params.photoId, params.viewer),
    getWigOrThrow(params.wigId),
  ]);

  const generationAccess = await getGenerationCreationAccess(params.viewer);
  if (!generationAccess.canCreateGeneration) {
    if (generationAccess.requiresLoginToGenerateAgain) {
      throwApiError(
        409,
        'GENERATION_LOGIN_REQUIRED',
        generationAccess.message ?? 'To generate again, please sign in.',
      );
    }

    throwApiError(
      409,
      'GENERATION_LIMIT_REACHED',
      generationAccess.message ??
        'This account already has a pending generation.',
    );
  }

  const generation = await prisma.generation.create({
    data: {
      userId: photo.userId,
      guestSessionId: photo.userId ? null : photo.guestSessionId,
      photoId: params.photoId,
      wigId: params.wigId,
      status: 'pending',
    },
  });

  return { generationId: generation.id };
}

export async function getGenerationCreationAccess(
  viewer: ViewerIdentity,
): Promise<GenerationCreationAccess> {
  if (viewer.userId) {
    const pendingGeneration = await prisma.generation.findFirst({
      where: {
        userId: viewer.userId,
        status: 'pending',
      },
      select: { id: true },
    });

    if (pendingGeneration) {
      return {
        canCreateGeneration: false,
        requiresLoginToGenerateAgain: false,
        message: 'You already have a generation in progress.',
      };
    }

    return {
      canCreateGeneration: true,
      requiresLoginToGenerateAgain: false,
      message: null,
    };
  }

  if (!viewer.guestSessionId) {
    return {
      canCreateGeneration: false,
      requiresLoginToGenerateAgain: true,
      message: 'Please sign in to generate a new image.',
    };
  }

  const existingGuestGeneration = await prisma.generation.findFirst({
    where: {
      guestSessionId: viewer.guestSessionId,
    },
    select: { id: true },
  });

  if (existingGuestGeneration) {
    return {
      canCreateGeneration: false,
      requiresLoginToGenerateAgain: true,
      message:
        'You already used your guest generation. Sign in to generate again.',
    };
  }

  return {
    canCreateGeneration: true,
    requiresLoginToGenerateAgain: false,
    message: null,
  };
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
    // Segmentation needs only the photo URL, so it runs while the images download.
    // There is deliberately no geometric fallback: guessing the hair region blanked
    // faces on tall photos. A failed segmentation fails the generation instead.
    const [maskUrl, selfieResponse, wigResponse] = await Promise.all([
      segmentHair(photo.imageUrl),
      fetch(photo.imageUrl),
      fetch(wig.imageUrl),
    ]);

    if (!selfieResponse.ok || !wigResponse.ok) {
      throw new Error('Failed to fetch images for generation.');
    }

    const [selfieRaw, wigRaw] = await Promise.all([
      selfieResponse.arrayBuffer(),
      wigResponse.arrayBuffer(),
    ]);

    const oriented = await orientImage(Buffer.from(selfieRaw));
    const layout = computeCanvasLayout(oriented.width, oriented.height);

    const [contentBuffer, hairGray, wigPng] = await Promise.all([
      resizeToContent(oriented.buffer, layout),
      buildHairMaskGray(maskUrl, layout),
      sharp(Buffer.from(wigRaw))
        .rotate()
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer(),
    ]);

    const [canvasBuffer, openAiMask] = await Promise.all([
      buildCanvasImage(contentBuffer, layout),
      toOpenAiMask(hairGray, layout),
    ]);

    const [selfieFile, wigFile, maskFile] = await Promise.all([
      toFile(canvasBuffer, 'selfie.png', { type: 'image/png' }),
      toFile(wigPng, 'wig.png', { type: 'image/png' }),
      toFile(openAiMask, 'mask.png', { type: 'image/png' }),
    ]);

    const prompt = `Image 1 is a photo of a person. Image 2 is a reference wig.
Edit only the transparent (masked) area of image 1: replace the person's hair with the exact hairstyle from image 2,
matching its color, length, texture, parting and fringe/bangs.
Everything outside the mask must stay pixel-identical: the face, eyes, eyebrows, skin tone, facial hair, expression,
glasses, headwear, clothing and background. Do not change the person's identity or age.
The hairline must sit naturally on the forehead and the hair must follow the person's head position, with lighting and shadows matching image 1.
Photorealistic result.`;
    const response = await openai.images.edit({
      model: 'gpt-image-2',
      image: [selfieFile, wigFile],
      mask: maskFile,
      prompt,
      quality: 'high',
      size: layout.size,
      output_format: 'png',
    });
    const base64 = response.data?.[0]?.b64_json;

    if (!base64) {
      throw new Error('OpenAI returned no image data.');
    }

    // Keep the model's hair but restore every other pixel from the original photo.
    const finalImage = await compositeHairOntoOriginal({
      original: contentBuffer,
      generated: Buffer.from(base64, 'base64'),
      hairGray,
      layout,
    });

    const { secureUrl: resultUrl } = await uploadGeneration(
      `data:image/jpeg;base64,${finalImage.toString('base64')}`,
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
  viewer: ViewerIdentity;
}) {
  const { generationId } = await createPendingGeneration(params);
  await runGeneration(generationId);
  return { generationId };
}
