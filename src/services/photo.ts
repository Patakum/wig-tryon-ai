import cloudinary from '@/src/lib/cloudinary';
import { prisma } from '@/src/lib/prisma';
import { throwApiError } from '@/src/lib/api/errors';
import { requireOwner } from '@/src/services/ownership';
import type { ViewerIdentity } from '@/src/types/viewer';

async function uploadBufferToCloudinary(buffer: Buffer) {
  return new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'wig-ai',
        resource_type: 'image',
        transformation: [
          { width: 1600, height: 1600, crop: 'limit' },
          { fetch_format: 'auto' },
          { quality: 'auto:good' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve({ secure_url: result.secure_url });
      },
    );

    stream.end(buffer);
  });
}

async function createPhoto(viewer: ViewerIdentity, imageUrl: string) {
  return prisma.photo.create({
    data: {
      userId: viewer.userId,
      guestSessionId: viewer.userId ? null : viewer.guestSessionId,
      imageUrl,
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
            guestSessionId: null,
          },
        }),

        tx.generation.updateMany({
          where: {
            userId: null,
            guestSessionId: params.guestSessionId,
          },
          data: {
            userId: params.userId,
            guestSessionId: null,
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

export async function uploadPhotoFromFile(file: File, viewer: ViewerIdentity) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadBufferToCloudinary(buffer);
  const photo = await createPhoto(viewer, uploaded.secure_url);

  return {
    photoId: photo.id,
  };
}

export async function uploadPhotoFromDataUri(
  file: string,
  viewer: ViewerIdentity,
) {
  const uploaded = await cloudinary.uploader.upload(file, {
    folder: 'wig-ai',
    transformation: [
      { width: 1600, height: 1600, crop: 'limit' },
      { fetch_format: 'auto' },
      { quality: 'auto:good' },
    ],
  });

  const photo = await createPhoto(viewer, uploaded.secure_url);

  return {
    photoId: photo.id,
  };
}

export async function getPhotoForViewer(
  photoId: string,
  viewer: ViewerIdentity,
) {
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });

  if (!photo) {
    throwApiError(404, 'NOT_FOUND', 'Photo not found');
  }

  requireOwner(photo, viewer);

  return photo;
}
