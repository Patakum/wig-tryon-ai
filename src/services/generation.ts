import OpenAI, { toFile } from 'openai';
import type { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import { prisma } from '@/src/lib/prisma';
import {
  fetchStoredImageBuffer,
  uploadGeneration,
} from '@/src/lib/cloudinary-utils';
import { throwApiError } from '@/src/lib/api/errors';
import { getWigOrThrow } from '@/src/services/wig';
import { getPhotoForViewer } from '@/src/services/photo';
import { segmentHair } from '@/src/lib/replicate';
import { buildHairMask, buildGeometricHairMask } from '@/src/lib/mask-utils';
import { requireOwner } from '@/src/services/ownership';
import { PENDING_TIMEOUT_MS } from '@/src/services/generation-limits';
import type { ViewerIdentity } from '@/src/types/viewer';

type GenerationCreationAccess = {
  canCreateGeneration: boolean;
  requiresLoginToGenerateAgain: boolean;
  message: string | null;
};

type GenerationDb = Pick<PrismaClient, 'generation'>;

const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DAILY_LIMIT = 3;

function getDailyGenerationLimit(): number {
  const parsed = Number.parseInt(process.env.GENERATION_DAILY_LIMIT ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_LIMIT;
}

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

  if (!generation || generation.deletedAt) {
    throwApiError(404, 'NOT_FOUND', 'Generation not found');
  }

  requireOwner(generation, viewer);

  return generation;
}

export async function createFeedbackForGeneration(params: {
  generationId: string;
  viewer: ViewerIdentity;
  message: string;
}) {
  const userId = params.viewer.userId;

  if (!userId) {
    throwApiError(401, 'UNAUTHORIZED', 'Sign in to leave feedback');
  }

  const generation = await prisma.generation.findUnique({
    where: { id: params.generationId },
    select: { userId: true, guestSessionId: true, deletedAt: true },
  });

  if (!generation || generation.deletedAt) {
    throwApiError(404, 'NOT_FOUND', 'Generation not found');
  }

  requireOwner(generation, params.viewer);

  return prisma.feedback.upsert({
    where: { generationId: params.generationId },
    create: { generationId: params.generationId, userId, message: params.message },
    update: { message: params.message },
  });
}

export async function getFeedbackMessage(
  generationId: string,
): Promise<string> {
  const feedback = await prisma.feedback.findUnique({
    where: { generationId },
    select: { message: true },
  });

  return feedback?.message ?? '';
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

  // Serialize check-and-create per owner so double taps and concurrent
  // requests cannot both pass the allowance check.
  const lockKey = params.viewer.userId ?? params.viewer.guestSessionId ?? '';

  const generation = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const generationAccess = await getGenerationCreationAccess(
      params.viewer,
      tx,
    );
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

    return tx.generation.create({
      data: {
        userId: photo.userId,
        guestSessionId: photo.userId ? null : photo.guestSessionId,
        photoId: params.photoId,
        wigId: params.wigId,
        status: 'pending',
      },
    });
  });

  return { generationId: generation.id };
}

export async function getGenerationCreationAccess(
  viewer: ViewerIdentity,
  db: GenerationDb = prisma,
): Promise<GenerationCreationAccess> {
  const owner = viewer.userId
    ? { userId: viewer.userId }
    : viewer.guestSessionId
      ? { guestSessionId: viewer.guestSessionId }
      : null;

  if (!owner) {
    return {
      canCreateGeneration: false,
      requiresLoginToGenerateAgain: true,
      message: 'Please sign in to generate a new image.',
    };
  }

  // A job whose worker died would otherwise block its owner forever.
  await db.generation.updateMany({
    where: {
      ...owner,
      status: 'pending',
      createdAt: { lt: new Date(Date.now() - PENDING_TIMEOUT_MS) },
    },
    data: { status: 'failed' },
  });

  if (viewer.userId) {
    const pendingGeneration = await db.generation.findFirst({
      where: { userId: viewer.userId, status: 'pending' },
      select: { id: true },
    });

    if (pendingGeneration) {
      return {
        canCreateGeneration: false,
        requiresLoginToGenerateAgain: false,
        message: 'You already have a generation in progress.',
      };
    }

    const dailyLimit = getDailyGenerationLimit();
    const completedToday = await db.generation.count({
      where: {
        userId: viewer.userId,
        status: 'completed',
        createdAt: { gt: new Date(Date.now() - DAILY_WINDOW_MS) },
      },
    });

    if (completedToday >= dailyLimit) {
      return {
        canCreateGeneration: false,
        requiresLoginToGenerateAgain: false,
        message: `You reached the daily limit of ${dailyLimit} generations. Try again tomorrow.`,
      };
    }

    return {
      canCreateGeneration: true,
      requiresLoginToGenerateAgain: false,
      message: null,
    };
  }

  // Failed generations refund the guest allowance.
  const existingGuestGeneration = await db.generation.findFirst({
    where: {
      guestSessionId: viewer.guestSessionId,
      status: { not: 'failed' },
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
    // The selfie is a private asset, so it is fetched with a server-signed
    // URL and never handed to a third party by link.
    const [selfieBuffer, wigResponse, geometricMaskBuffer] = await Promise.all([
      fetchStoredImageBuffer({
        imageUrl: photo.imageUrl,
        publicId: photo.imagePublicId,
      }),
      fetch(wig.imageUrl),
      buildGeometricHairMask(1024, 1024),
    ]);

    if (!wigResponse.ok) {
      throw new Error('Failed to fetch images for generation.');
    }

    const wigBuffer = await wigResponse.arrayBuffer();

    // Only attempt AI segmentation if REPLICATE_HAIR_SEGMENTATION_MODEL is
    // set. The image is sent as bytes (data URI), not as a link.
    let maskUrl: string | null = null;
    if (process.env.REPLICATE_HAIR_SEGMENTATION_MODEL) {
      try {
        const { format } = await sharp(selfieBuffer).metadata();
        maskUrl = await segmentHair(
          `data:image/${format ?? 'jpeg'};base64,${selfieBuffer.toString('base64')}`,
        );
      } catch (err: unknown) {
        console.warn(
          '[generation] Hair segmentation failed — falling back to geometric mask:',
          err,
        );
      }
    }

    // Normalize selfie to 1024×1024 in parallel with fetching an AI mask (if any).
    // OpenAI requires mask and image to be the exact same dimensions.
    const [normalizedSelfieBuffer, aiMaskBuffer] = await Promise.all([
      sharp(selfieBuffer)
        .resize(1024, 1024, {
          fit: 'contain',
          position: 'centre',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
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
      model: 'gpt-image-2',
      image: [selfieFile, wigFile],
      mask: maskFile,
      prompt,
      quality: 'auto',
      size: '1024x1024',
      output_format: 'jpeg',
    });
    const base64 = response.data?.[0]?.b64_json;

    if (!base64) {
      throw new Error('OpenAI returned no image data.');
    }

    const { secureUrl: resultUrl, publicId: resultPublicId } =
      await uploadGeneration(
      `data:image/jpeg;base64,${base64}`,
    );

    await prisma.generation.update({
      where: { id: generationId },
      data: {
        resultImageUrl: resultUrl,
        resultPublicId,
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
