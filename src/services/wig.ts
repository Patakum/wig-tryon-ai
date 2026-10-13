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

export async function getFavoriteState(params: {
  wigId: string;
  userId: string | null;
}) {
  if (!params.userId) {
    return { isFavorited: false };
  }

  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_wigId: {
        userId: params.userId,
        wigId: params.wigId,
      },
    },
    select: { id: true },
  });

  return {
    isFavorited: Boolean(favorite),
  };
}

export async function toggleFavorite(params: { wigId: string; userId: string }) {
  await getWigOrThrow(params.wigId);

  return prisma.$transaction(async (tx) => {
    const favorite = await tx.favorite.findUnique({
      where: {
        userId_wigId: {
          userId: params.userId,
          wigId: params.wigId,
        },
      },
      select: { id: true },
    });

    if (favorite) {
      await tx.favorite.delete({
        where: {
          userId_wigId: {
            userId: params.userId,
            wigId: params.wigId,
          },
        },
      });

      return { isFavorited: false };
    }

    await tx.favorite.create({
      data: {
        userId: params.userId,
        wigId: params.wigId,
      },
    });

    return { isFavorited: true };
  });
}

export async function getFavoriteWigs(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      wig: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          price: true,
          description: true,
        },
      },
    },
  });
}
