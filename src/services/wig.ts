import { prisma } from '@/src/lib/prisma';
import { uploadWigFromBuffer } from '@/src/lib/cloudinary-utils';
import { throwApiError } from '@/src/lib/api/errors';

export async function uploadWigReferenceImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const { secureUrl } = await uploadWigFromBuffer(buffer);
  return secureUrl;
}

type WigFields = {
  name: string;
  description?: string | null;
  price: number | null;
};

// An emptied description is stored as null so the field can be cleared.
function toWigData(data: WigFields) {
  return {
    name: data.name.trim(),
    description: data.description || null,
    price: data.price,
  };
}

export async function createWig(data: WigFields & { imageUrl: string }) {
  return prisma.wig.create({
    data: { ...toWigData(data), imageUrl: data.imageUrl },
  });
}

export async function updateWig(
  wigId: string,
  data: WigFields & { imageUrl?: string },
) {
  return prisma.wig.update({
    where: { id: wigId },
    data: {
      ...toWigData(data),
      ...(data.imageUrl && { imageUrl: data.imageUrl }),
    },
  });
}

export async function getLatestWigs(limit = 8) {
  return prisma.wig.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, name: true, imageUrl: true, price: true },
  });
}

export async function getWigs() {
  return prisma.wig.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, imageUrl: true, price: true },
  });
}

export async function getWig(wigId: string) {
  return prisma.wig.findUnique({
    where: { id: wigId },
    select: { id: true, name: true, imageUrl: true, price: true, description: true },
  });
}

export async function getWigOrThrow(wigId: string) {
  const wig = await prisma.wig.findUnique({ where: { id: wigId } });

  if (!wig) {
    throwApiError(404, 'NOT_FOUND', 'Wig not found');
  }

  return wig;
}
