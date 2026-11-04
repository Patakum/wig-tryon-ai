import { prisma } from '@/src/lib/prisma';
import { uploadWigFromBuffer } from '@/src/lib/cloudinary-utils';

export async function uploadWigImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const { secureUrl } = await uploadWigFromBuffer(buffer);
  return secureUrl;
}

export async function createWigImage(data: {
  wigId: string;
  imageUrl: string;
  angle?: string | null;
  order: number;
}) {
  return prisma.wigImage.create({
    data: {
      wigId: data.wigId,
      imageUrl: data.imageUrl,
      angle: data.angle || null,
      order: data.order,
    },
  });
}

export async function getWigImages(wigId: string) {
  return prisma.wigImage.findMany({
    where: { wigId },
    orderBy: { order: 'asc' },
    select: { id: true, imageUrl: true, angle: true, order: true },
  });
}

export async function deleteWigImage(imageId: string) {
  return prisma.wigImage.delete({ where: { id: imageId } });
}
