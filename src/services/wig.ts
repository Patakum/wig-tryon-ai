import sharp from 'sharp';
import { prisma } from '@/src/lib/prisma';
import { uploadWigFromBuffer } from '@/src/lib/cloudinary-utils';
import { throwApiError } from '@/src/lib/api/errors';

export const MAX_WIG_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_FORMATS = new Set(['jpeg', 'png', 'webp']);

// Validate the real file content, not the client-declared MIME type.
export async function assertValidWigImage(buffer: Buffer): Promise<void> {
  if (buffer.length === 0 || buffer.length > MAX_WIG_IMAGE_BYTES) {
    throwApiError(400, 'BAD_REQUEST', 'Image must be 10MB or smaller');
  }

  let format: string | undefined;
  try {
    format = (await sharp(buffer).metadata()).format;
  } catch {
    throwApiError(400, 'BAD_REQUEST', 'File is not a readable image');
  }

  if (!format || !ALLOWED_IMAGE_FORMATS.has(format)) {
    throwApiError(400, 'BAD_REQUEST', 'Use a JPEG, PNG or WebP image');
  }
}

export async function uploadWigReferenceImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await assertValidWigImage(buffer);
  const { secureUrl } = await uploadWigFromBuffer(buffer);
  return secureUrl;
}

export async function createWig(data: {
  name: string;
  imageUrl: string;
  description: string | null;
  price: number | null;
}) {
  return prisma.wig.create({
    data: {
      name: data.name.trim(),
      imageUrl: data.imageUrl,
      description: data.description,
      price: data.price,
      photos: { create: { imageUrl: data.imageUrl, position: 0 } },
    },
  });
}

export async function getLatestWigs(limit = 8) {
  return prisma.wig.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, name: true, imageUrl: true, price: true },
  });
}

export async function getWigs() {
  return prisma.wig.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, imageUrl: true, price: true },
  });
}

export async function getWigsForAdmin() {
  return prisma.wig.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, imageUrl: true, archivedAt: true },
  });
}

export async function getWig(wigId: string) {
  const wig = await prisma.wig.findUnique({
    where: { id: wigId },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      price: true,
      description: true,
      archivedAt: true,
      photos: {
        orderBy: { position: 'asc' },
        select: { id: true, imageUrl: true },
      },
    },
  });

  if (!wig) {
    return null;
  }

  // Wigs created before photos existed fall back to their single image.
  const photos =
    wig.photos.length > 0
      ? wig.photos
      : [{ id: 'main', imageUrl: wig.imageUrl }];

  return { ...wig, photos };
}

export async function getWigOrThrow(wigId: string) {
  const wig = await prisma.wig.findUnique({ where: { id: wigId } });

  if (!wig) {
    throwApiError(404, 'NOT_FOUND', 'Wig not found');
  }

  if (wig.archivedAt) {
    throwApiError(409, 'WIG_UNAVAILABLE', 'This wig is no longer available');
  }

  return wig;
}
