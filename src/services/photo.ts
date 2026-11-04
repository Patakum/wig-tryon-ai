import { uploadPrivateSelfie } from '@/src/lib/cloudinary-utils';
import { prisma } from '@/src/lib/prisma';
import { throwApiError } from '@/src/lib/api/errors';
import { requireOwner } from '@/src/services/ownership';
import { normalizeSelfie } from '@/src/services/selfie-image';
import type { ViewerIdentity } from '@/src/types/viewer';

async function createPhoto(
  viewer: ViewerIdentity,
  image: { secureUrl: string; publicId: string },
) {
  return prisma.photo.create({
    data: {
      userId: viewer.userId,
      guestSessionId: viewer.userId ? null : viewer.guestSessionId,
      imageUrl: image.secureUrl,
      imagePublicId: image.publicId,
    },
  });
}

export async function transferGuestOwnershipToUser(params: {
  userId: string;
  guestSessionId: string;
}) {
  const { photoResult, generationResult } = await prisma.$transaction(
    async (tx) => {
      const [claimedPhotoByOtherUser, claimedGenerationByOtherUser] =
        await Promise.all([
          tx.photo.findFirst({
            where: {
              guestSessionId: params.guestSessionId,
              userId: {
                not: null,
                notIn: [params.userId],
              },
            },
            select: { id: true },
          }),
          tx.generation.findFirst({
            where: {
              guestSessionId: params.guestSessionId,
              userId: {
                not: null,
                notIn: [params.userId],
              },
            },
            select: { id: true },
          }),
        ]);

      if (claimedPhotoByOtherUser || claimedGenerationByOtherUser) {
        throwApiError(
          403,
          'FORBIDDEN',
          'This guest session is already linked to a different account.',
        );
      }

      const [photoUpdateResult, generationUpdateResult] = await Promise.all([
        tx.photo.updateMany({
          where: {
            userId: null,
            guestSessionId: params.guestSessionId,
          },
          data: {
            userId: params.userId,
          },
        }),
        tx.generation.updateMany({
          where: {
            userId: null,
            guestSessionId: params.guestSessionId,
          },
          data: {
            userId: params.userId,
          },
        }),
      ]);

      return {
        photoResult: photoUpdateResult,
        generationResult: generationUpdateResult,
      };
    },
  );

  return {
    transferredPhotoCount: photoResult.count,
    transferredGenerationCount: generationResult.count,
  };
}

export async function uploadPhotoFromFile(
  file: File,
  viewer: ViewerIdentity,
) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadPrivateSelfie(await normalizeSelfie(buffer));
  const photo = await createPhoto(viewer, uploaded);

  return {
    photoId: photo.id,
  };
}

export async function uploadPhotoFromDataUri(
  file: string,
  viewer: ViewerIdentity,
) {
  const separator = file.indexOf(',');
  const header = separator === -1 ? '' : file.slice(0, separator);

  if (!/^data:image\/[a-z0-9.+-]+;base64$/i.test(header)) {
    throwApiError(400, 'PHOTO_UNREADABLE', 'לא ניתן לקרוא את התמונה.');
  }

  const buffer = Buffer.from(file.slice(separator + 1), 'base64');
  const uploaded = await uploadPrivateSelfie(await normalizeSelfie(buffer));

  const photo = await createPhoto(viewer, uploaded);

  return {
    photoId: photo.id,
  };
}

export async function getPhotoForViewer(
  photoId: string,
  viewer: ViewerIdentity,
) {
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });

  if (!photo || photo.deletedAt) {
    throwApiError(404, 'NOT_FOUND', 'Photo not found');
  }

  requireOwner(photo, viewer);

  return photo;
}