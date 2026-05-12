import { prisma } from '@/src/lib/prisma';
import { uploadWigFromBuffer } from '@/src/lib/cloudinary-utils';
import { throwApiError } from '@/src/lib/api/errors';

export async function uploadWigReferenceImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
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

export async function getWigOrThrow(wigId: string) {
  const wig = await prisma.wig.findUnique({ where: { id: wigId } });

  if (!wig) {
    throwApiError(404, 'NOT_FOUND', 'Wig not found');
  }

  return wig;
}
