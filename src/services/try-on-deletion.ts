import { prisma } from '@/src/lib/prisma';
import { throwApiError } from '@/src/lib/api/errors';
import { deleteImage, getPublicIdFromUrl } from '@/src/lib/cloudinary-utils';
import { requireOwner } from '@/src/services/ownership';
import type { ViewerIdentity } from '@/src/types/viewer';

async function purgeStoredImages(imageUrls: string[]) {
  const publicIds = imageUrls.map((url) => {
    const publicId = getPublicIdFromUrl(url);

    if (!publicId) {
      throwApiError(502, 'DELETE_FAILED', 'Could not delete the stored image');
    }

    return publicId;
  });

  try {
    for (const publicId of publicIds) {
      await deleteImage(publicId);
    }
  } catch {
    throwApiError(502, 'DELETE_FAILED', 'Could not delete the stored image');
  }
}

/**
 * Delete a try-on: its result image, feedback and, when no other try-on uses
 * it, the uploaded selfie. Files are removed first so a failure leaves the
 * record in place and the request can be retried. The generation row is kept
 * as a soft-deleted tombstone so it still counts toward the daily quota.
 */
export async function deleteTryOn(
  generationId: string,
  viewer: ViewerIdentity,
): Promise<void> {
  if (!viewer.userId) {
    throwApiError(401, 'UNAUTHORIZED', 'Sign in to delete a try-on');
  }

  const generation = await prisma.generation.findUnique({
    where: { id: generationId },
    select: {
      id: true,
      userId: true,
      guestSessionId: true,
      photoId: true,
      status: true,
      resultImageUrl: true,
      deletedAt: true,
      photo: { select: { imageUrl: true, deletedAt: true } },
    },
  });

  if (!generation || generation.deletedAt) {
    throwApiError(404, 'NOT_FOUND', 'Generation not found');
  }

  requireOwner(generation, viewer);

  if (generation.userId !== viewer.userId) {
    throwApiError(403, 'FORBIDDEN', 'Forbidden');
  }

  if (generation.status === 'pending') {
    throwApiError(
      409,
      'GENERATION_IN_PROGRESS',
      'Wait for the generation to finish before deleting it.',
    );
  }

  const otherUses = await prisma.generation.count({
    where: {
      photoId: generation.photoId,
      id: { not: generation.id },
      deletedAt: null,
    },
  });
  const deletePhoto = otherUses === 0 && !generation.photo.deletedAt;

  const imageUrls = [
    generation.resultImageUrl,
    deletePhoto ? generation.photo.imageUrl : null,
  ].filter((url): url is string => Boolean(url));

  await purgeStoredImages(imageUrls);

  const now = new Date();

  await prisma.$transaction([
    prisma.feedback.deleteMany({ where: { generationId: generation.id } }),
    prisma.generation.update({
      where: { id: generation.id },
      data: { deletedAt: now, resultImageUrl: null },
    }),
    ...(deletePhoto
      ? [
          prisma.photo.update({
            where: { id: generation.photoId },
            data: { deletedAt: now, imageUrl: '' },
          }),
        ]
      : []),
  ]);
}
