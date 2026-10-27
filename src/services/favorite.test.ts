import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    wig: { findUnique: vi.fn() },
    favorite: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/src/lib/prisma', () => ({ prisma: mocks.prisma }));

import {
  addFavorite,
  getFavoriteWigs,
  isFavorite,
  removeFavorite,
} from '@/src/services/favorite';

describe('favorites', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('saves a favorite idempotently for the given user', async () => {
    mocks.prisma.wig.findUnique.mockResolvedValue({ id: 'wig-1' });

    await addFavorite('user-a', 'wig-1');

    expect(mocks.prisma.favorite.upsert).toHaveBeenCalledWith({
      where: { userId_wigId: { userId: 'user-a', wigId: 'wig-1' } },
      create: { userId: 'user-a', wigId: 'wig-1' },
      update: {},
    });
  });

  it('rejects a favorite for an unknown wig', async () => {
    mocks.prisma.wig.findUnique.mockResolvedValue(null);

    await expect(addFavorite('user-a', 'missing')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    });
    expect(mocks.prisma.favorite.upsert).not.toHaveBeenCalled();
  });

  it('removes only the requesting user’s favorite', async () => {
    await removeFavorite('user-a', 'wig-1');

    expect(mocks.prisma.favorite.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-a', wigId: 'wig-1' },
    });
  });

  it('reports whether a wig is favorited', async () => {
    mocks.prisma.favorite.findUnique.mockResolvedValueOnce({ id: 'f1' });
    mocks.prisma.favorite.findUnique.mockResolvedValueOnce(null);

    await expect(isFavorite('user-a', 'wig-1')).resolves.toBe(true);
    await expect(isFavorite('user-a', 'wig-2')).resolves.toBe(false);
  });

  it('lists only the user’s favorite wigs, newest first', async () => {
    const wig = { id: 'wig-1', name: 'A', imageUrl: 'u', price: 1 };
    mocks.prisma.favorite.findMany.mockResolvedValue([{ wig }]);

    await expect(getFavoriteWigs('user-a')).resolves.toEqual([wig]);
    expect(mocks.prisma.favorite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-a' },
        orderBy: { createdAt: 'desc' },
      }),
    );
  });
});
