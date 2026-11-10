import { prisma } from '@/src/lib/prisma';
import { getWigOrThrow } from '@/src/services/wig';

export async function addFavorite(userId: string, wigId: string) {
  await getWigOrThrow(wigId);

  await prisma.favorite.upsert({
    where: { userId_wigId: { userId, wigId } },
    create: { userId, wigId },
    update: {},
  });
}

export async function removeFavorite(userId: string, wigId: string) {
  await prisma.favorite.deleteMany({ where: { userId, wigId } });
}

export async function isFavorite(userId: string, wigId: string) {
  const favorite = await prisma.favorite.findUnique({
    where: { userId_wigId: { userId, wigId } },
    select: { id: true },
  });

  return favorite !== null;
}

export async function getFavoriteWigs(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId, wig: { archivedAt: null } },
    orderBy: { createdAt: 'desc' },
    select: {
      wig: { select: { id: true, name: true, imageUrl: true, price: true } },
    },
  });

  return favorites.map((favorite) => favorite.wig);
}
