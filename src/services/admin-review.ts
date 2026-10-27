import { prisma } from '@/src/lib/prisma';
import { throwApiError } from '@/src/lib/api/errors';
import { fetchStoredImage } from '@/src/lib/cloudinary-utils';
import { requireOwner } from '@/src/services/ownership';
import type { ViewerIdentity } from '@/src/types/viewer';

export type AdminImageKind = 'selfie' | 'result';

export async function getFeedbackForAdmin() {
  const feedbacks = await prisma.feedback.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      message: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { email: true } },
      generation: {
        select: {
          id: true,
          status: true,
          resultImageUrl: true,
          resultPublicId: true,
          adminCanSeeSelfie: true,
          adminCanSeeResult: true,
          photo: { select: { imageUrl: true, imagePublicId: true } },
          wig: { select: { name: true, imageUrl: true } },
        },
      },
    },
  });

  // Customers choose whether admins may see their photo and result. The page
  // gets flags only; the images themselves load through the admin image
  // route, which enforces the same choice.
  return feedbacks.map(({ generation, ...feedback }) => ({
    ...feedback,
    generation: {
      id: generation.id,
      status: generation.status,
      wig: generation.wig,
      selfie: {
        visible:
          generation.adminCanSeeSelfie &&
          Boolean(generation.photo.imageUrl || generation.photo.imagePublicId),
        hiddenByCustomer: !generation.adminCanSeeSelfie,
      },
      result: {
        visible:
          generation.adminCanSeeResult &&
          Boolean(generation.resultImageUrl || generation.resultPublicId),
        hiddenByCustomer: !generation.adminCanSeeResult,
      },
    },
  }));
}

export async function getAdminImage(
  generationId: string,
  kind: AdminImageKind,
) {
  const generation = await prisma.generation.findUnique({
    where: { id: generationId },
    select: {
      deletedAt: true,
      resultImageUrl: true,
      resultPublicId: true,
      adminCanSeeSelfie: true,
      adminCanSeeResult: true,
      photo: { select: { imageUrl: true, imagePublicId: true } },
    },
  });

  if (!generation || generation.deletedAt) {
    throwApiError(404, 'NOT_FOUND', 'Image not found');
  }

  const allowed =
    kind === 'selfie'
      ? generation.adminCanSeeSelfie
      : generation.adminCanSeeResult;

  if (!allowed) {
    throwApiError(403, 'HIDDEN_BY_CUSTOMER', 'The customer hid this image');
  }

  const ref =
    kind === 'selfie'
      ? {
          imageUrl: generation.photo.imageUrl || null,
          publicId: generation.photo.imagePublicId,
        }
      : {
          imageUrl: generation.resultImageUrl,
          publicId: generation.resultPublicId,
        };

  if (!ref.imageUrl && !ref.publicId) {
    throwApiError(404, 'NOT_FOUND', 'Image not found');
  }

  return fetchStoredImage(ref);
}

export async function updateAdminVisibility(
  generationId: string,
  viewer: ViewerIdentity,
  settings: { adminCanSeeSelfie?: boolean; adminCanSeeResult?: boolean },
) {
  if (!viewer.userId) {
    throwApiError(401, 'UNAUTHORIZED', 'Sign in to change this setting');
  }

  const generation = await prisma.generation.findUnique({
    where: { id: generationId },
    select: { userId: true, guestSessionId: true, deletedAt: true },
  });

  if (!generation || generation.deletedAt) {
    throwApiError(404, 'NOT_FOUND', 'Generation not found');
  }

  requireOwner(generation, viewer);

  if (generation.userId !== viewer.userId) {
    throwApiError(403, 'FORBIDDEN', 'Forbidden');
  }

  return prisma.generation.update({
    where: { id: generationId },
    data: {
      ...(settings.adminCanSeeSelfie !== undefined
        ? { adminCanSeeSelfie: settings.adminCanSeeSelfie }
        : {}),
      ...(settings.adminCanSeeResult !== undefined
        ? { adminCanSeeResult: settings.adminCanSeeResult }
        : {}),
    },
    select: { adminCanSeeSelfie: true, adminCanSeeResult: true },
  });
}
