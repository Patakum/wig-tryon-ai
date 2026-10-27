import { prisma } from '@/src/lib/prisma';
import { throwApiError } from '@/src/lib/api/errors';
import { deleteImage, getPublicIdFromUrl } from '@/src/lib/cloudinary-utils';
import { uploadWigReferenceImage } from '@/src/services/wig';

export const MAX_WIG_PHOTOS = 5;

export type MoveDirection = 'up' | 'down';

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function getWigForAdmin(wigId: string) {
  return prisma.wig.findUnique({
    where: { id: wigId },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      imageUrl: true,
      photos: {
        orderBy: { position: 'asc' },
        select: { id: true, imageUrl: true, position: true },
      },
    },
  });
}

export async function updateWigDetails(
  wigId: string,
  data: { name: string; description: string | null; price: number | null },
) {
  const wig = await prisma.wig.findUnique({
    where: { id: wigId },
    select: { id: true },
  });

  if (!wig) {
    throwApiError(404, 'NOT_FOUND', 'Wig not found');
  }

  return prisma.wig.update({
    where: { id: wigId },
    data: {
      name: data.name.trim(),
      description: data.description,
      price: data.price,
    },
    select: { id: true, name: true, description: true, price: true },
  });
}

// The first photo is the main one; keep Wig.imageUrl (used by the catalog,
// favorites and try-on) in sync with it.
async function syncMainPhoto(tx: Tx, wigId: string) {
  const main = await tx.wigPhoto.findFirst({
    where: { wigId },
    orderBy: { position: 'asc' },
    select: { imageUrl: true },
  });

  if (main) {
    await tx.wig.update({
      where: { id: wigId },
      data: { imageUrl: main.imageUrl },
    });
  }
}

async function lockWig(tx: Tx, wigId: string) {
  const key = `wig-photos:${wigId}`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
}

async function purgeWigImage(imageUrl: string) {
  // Catalog images are public, so a failed purge only leaves an unused file.
  const publicId = getPublicIdFromUrl(imageUrl);

  if (!publicId) {
    return;
  }

  try {
    await deleteImage(publicId);
  } catch (error) {
    console.error('[wig-photo] Failed to delete stored image:', error);
  }
}

function throwPhotoLimit(): never {
  throwApiError(
    409,
    'PHOTO_LIMIT_REACHED',
    `A wig can have at most ${MAX_WIG_PHOTOS} photos`,
  );
}

export async function addWigPhoto(wigId: string, file: File) {
  const wig = await prisma.wig.findUnique({
    where: { id: wigId },
    select: { id: true },
  });

  if (!wig) {
    throwApiError(404, 'NOT_FOUND', 'Wig not found');
  }

  if ((await prisma.wigPhoto.count({ where: { wigId } })) >= MAX_WIG_PHOTOS) {
    throwPhotoLimit();
  }

  const imageUrl = await uploadWigReferenceImage(file);

  try {
    return await prisma.$transaction(async (tx) => {
      await lockWig(tx, wigId);

      const count = await tx.wigPhoto.count({ where: { wigId } });
      if (count >= MAX_WIG_PHOTOS) {
        throwPhotoLimit();
      }

      const photo = await tx.wigPhoto.create({
        data: { wigId, imageUrl, position: count },
        select: { id: true, imageUrl: true, position: true },
      });
      await syncMainPhoto(tx, wigId);

      return photo;
    });
  } catch (error) {
    await purgeWigImage(imageUrl);
    throw error;
  }
}

export async function removeWigPhoto(wigId: string, photoId: string) {
  const removedUrl = await prisma.$transaction(async (tx) => {
    await lockWig(tx, wigId);

    const photos = await tx.wigPhoto.findMany({
      where: { wigId },
      orderBy: { position: 'asc' },
      select: { id: true, imageUrl: true },
    });
    const target = photos.find((photo) => photo.id === photoId);

    if (!target) {
      throwApiError(404, 'NOT_FOUND', 'Photo not found');
    }

    if (photos.length <= 1) {
      throwApiError(409, 'LAST_PHOTO', 'A wig needs at least one photo');
    }

    await tx.wigPhoto.delete({ where: { id: photoId } });

    const remaining = photos.filter((photo) => photo.id !== photoId);
    for (const [position, photo] of remaining.entries()) {
      await tx.wigPhoto.update({ where: { id: photo.id }, data: { position } });
    }
    await syncMainPhoto(tx, wigId);

    return target.imageUrl;
  });

  await purgeWigImage(removedUrl);
}

export async function moveWigPhoto(
  wigId: string,
  photoId: string,
  direction: MoveDirection,
) {
  await prisma.$transaction(async (tx) => {
    await lockWig(tx, wigId);

    const photos = await tx.wigPhoto.findMany({
      where: { wigId },
      orderBy: { position: 'asc' },
      select: { id: true },
    });
    const index = photos.findIndex((photo) => photo.id === photoId);

    if (index === -1) {
      throwApiError(404, 'NOT_FOUND', 'Photo not found');
    }

    const swapWith = direction === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= photos.length) {
      return;
    }

    const ordered = photos.map((photo) => photo.id);
    [ordered[index], ordered[swapWith]] = [ordered[swapWith], ordered[index]];

    for (const [position, id] of ordered.entries()) {
      await tx.wigPhoto.update({ where: { id }, data: { position } });
    }
    await syncMainPhoto(tx, wigId);
  });
}
