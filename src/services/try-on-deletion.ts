import { prisma } from '@/src/lib/prisma';
import { throwApiError } from '@/src/lib/api/errors';
import { deleteImage, getPublicIdFromUrl } from '@/src/lib/cloudinary-utils';
import { requireOwner } from '@/src/services/ownership';
import type { ViewerIdentity } from '@/src/types/viewer';

export type StoredImage = { imageUrl: string | null; publicId: string | null };

export async function purgeStoredImages(images: StoredImage[]) {
  // Private images are deleted by public ID; legacy rows only have the old
  // public URL.
  const targets = images.map((image) => {
    if (image.publicId) {
      return { publicId: image.publicId, type: 'authenticated' as const };
    }

    const publicId = image.imageUrl ? getPublicIdFromUrl(image.imageUrl) : null;

    if (!publicId) {
      throwApiError(502, 'DELETE_FAILED', 'Could not delete the stored image');
    }

    return { publicId, type: 'upload' as const };
  });

  try {
    for (const target of targets) {
      await deleteImage(target.publicId, target.type);
    }
  } catch {
    throwApiError(502, 'DELETE_FAILED', 'Could not delete the stored image');
  }
}

const DELETE_ALL_BATCH = 20;

/**
 * Delete up to a batch of the customer's try-ons (finished or failed; jobs in
 * progress are left alone). Callers repeat until `remaining` is 0 so a large
 * history never runs into a request time limit.
 */
export async function deleteAllTryOns(viewer: ViewerIdentity) {
  const userId = viewer.userId;

  if (!userId) {
    throwApiError(401, 'UNAUTHORIZED', 'Sign in to delete your try-ons');
  }

  const where = { userId, deletedAt: null, status: { not: 'pending' } };
  const batch = await prisma.generation.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    take: DELETE_ALL_BATCH,
    select: { id: true },
  });

  let deleted = 0;
  let failed = 0;

  for (const { id } of batch) {
    try {
      await deleteTryOn(id, viewer);
      deleted += 1;
    } catch {
      failed += 1;
    }
  }

  const remaining = await prisma.generation.count({ where });

  return { deleted, failed, remaining };
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
      resultPublicId: true,
      deletedAt: true,
      photo: {
        select: { imageUrl: true, imagePublicId: true, deletedAt: true },
      },
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

  const images: StoredImage[] = [];

  if (generation.resultImageUrl || generation.resultPublicId) {
    images.push({
      imageUrl: generation.resultImageUrl,
      publicId: generation.resultPublicId,
    });
  }

  if (deletePhoto && (generation.photo.imageUrl || generation.photo.imagePublicId)) {
    images.push({
      imageUrl: generation.photo.imageUrl,
      publicId: generation.photo.imagePublicId,
    });
  }

  await purgeStoredImages(images);

  const now = new Date();

  await prisma.$transaction([
    prisma.feedback.deleteMany({ where: { generationId: generation.id } }),
    prisma.generation.update({
      where: { id: generation.id },
      data: { deletedAt: now, resultImageUrl: null, resultPublicId: null },
    }),
    ...(deletePhoto
      ? [
          prisma.photo.update({
            where: { id: generation.photoId },
            data: { deletedAt: now, imageUrl: '', imagePublicId: null },
          }),
        ]
      : []),
  ]);
}
