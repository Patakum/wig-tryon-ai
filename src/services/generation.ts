import OpenAI, { toFile } from 'openai';
import { prisma } from '@/src/lib/prisma';
import { uploadGeneration } from '@/src/lib/cloudinary-utils';
import { throwApiError } from '@/src/lib/api/errors';
import { getWigOrThrow } from '@/src/services/wig';
import { getPhotoForViewer } from '@/src/services/photo';

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

export async function generateTryOn(params: {
  photoId: string;
  wigId: string;
  viewerUserId: string | null;
}) {
  const openai = getOpenAiClient();

  const [photo, wig] = await Promise.all([
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

  const [selfieResponse, wigResponse] = await Promise.all([
    fetch(photo.imageUrl),
    fetch(wig.imageUrl),
  ]);

  if (!selfieResponse.ok || !wigResponse.ok) {
    await prisma.generation.update({
      where: { id: generation.id },
      data: { status: 'failed' },
    });

    throwApiError(
      500,
      'UPSTREAM_IMAGE_FETCH_FAILED',
      'Failed to fetch images for generation.',
    );
  }

  const [selfieBuffer, wigBuffer] = await Promise.all([
    selfieResponse.arrayBuffer(),
    wigResponse.arrayBuffer(),
  ]);

  const [selfieFile, wigFile] = await Promise.all([
    toFile(Buffer.from(selfieBuffer), 'selfie.png', { type: 'image/png' }),
    toFile(Buffer.from(wigBuffer), 'wig.png', { type: 'image/png' }),
  ]);

  const prompt =
    'Replace the hairstyle of the person in the first image with the hairstyle from the second image. Keep the same face, identity, and facial features. Do not change the person. Make the result photorealistic with natural lighting. Match the hairstyle exactly in shape and color.';

  const response = await openai.images.edit({
    model: 'gpt-image-1',
    image: [selfieFile, wigFile],
    prompt,
    quality: 'low',
    size: '1024x1024',
  });

  const base64 = response.data?.[0]?.b64_json;

  if (!base64) {
    await prisma.generation.update({
      where: { id: generation.id },
      data: { status: 'failed' },
    });

    throwApiError(500, 'OPENAI_EMPTY_IMAGE', 'OpenAI returned no image data.');
  }

  const { secureUrl: resultUrl } = await uploadGeneration(
    `data:image/png;base64,${base64}`,
  );

  await prisma.generation.update({
    where: { id: generation.id },
    data: {
      resultImageUrl: resultUrl,
      status: 'completed',
    },
  });

  return { generationId: generation.id };
}
