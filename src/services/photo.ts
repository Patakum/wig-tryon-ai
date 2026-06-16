import cloudinary from '@/src/lib/cloudinary';
import { prisma } from '@/src/lib/prisma';
import { throwApiError } from '@/src/lib/api/errors';

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

async function createPhoto(userId: string | null, imageUrl: string) {
  return prisma.photo.create({
    data: {
      userId,
      imageUrl,
    },
  });
}

export async function uploadPhotoFromFile(file: File, userId: string | null) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadBufferToCloudinary(buffer);
  const photo = await createPhoto(userId, uploaded.secure_url);

  return {
    photoId: photo.id,
    imageUrl: photo.imageUrl,
  };
}

export async function uploadPhotoFromDataUri(
  file: string,
  userId: string | null,
) {
  const uploaded = await cloudinary.uploader.upload(file, {
    folder: 'wig-ai',
    transformation: [
      { width: 1600, height: 1600, crop: 'limit' },
      { fetch_format: 'auto' },
      { quality: 'auto:good' },
    ],
  });

  const photo = await createPhoto(userId, uploaded.secure_url);

  return {
    photoId: photo.id,
    imageUrl: photo.imageUrl,
  };
}

export async function getPhotoForViewer(
  photoId: string,
  viewerUserId: string | null,
) {
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });

  if (!photo) {
    throwApiError(404, 'NOT_FOUND', 'Photo not found');
  }

  if (photo.userId && photo.userId !== viewerUserId) {
    throwApiError(403, 'FORBIDDEN', 'Forbidden');
  }

  return photo;
}

export async function getPhoto(photoId: string) {
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) {
    throwApiError(404, 'NOT_FOUND', 'Photo not found');
  }
  return photo;
}