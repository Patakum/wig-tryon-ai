import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    wig: {
      findUnique: vi.fn(),
    },
    favorite: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/src/lib/prisma', () => ({
  prisma: mocks.prisma,
}));

import {
  getFavoriteState,
  getFavoriteWigs,
  toggleFavorite,
} from '@/src/services/wig';

describe('favorite service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prisma.$transaction.mockImplementation(
      async (
        callback: (tx: {
          favorite: {
            findUnique: typeof mocks.prisma.favorite.findUnique;
            create: typeof mocks.prisma.favorite.create;
            delete: typeof mocks.prisma.favorite.delete;
          };
        }) => Promise<unknown>,
      ) =>
        callback({
          favorite: {
            findUnique: mocks.prisma.favorite.findUnique,
            create: mocks.prisma.favorite.create,
            delete: mocks.prisma.favorite.delete,
          },
        }),
    );
  });

  it('returns not favorited for guests', async () => {
    await expect(
      getFavoriteState({
        wigId: 'wig-1',
        userId: null,
      }),
    ).resolves.toEqual({ isFavorited: false });

    expect(mocks.prisma.favorite.findUnique).not.toHaveBeenCalled();
  });

  it('returns favorited when a favorite exists', async () => {
    mocks.prisma.favorite.findUnique.mockResolvedValue({ id: 'fav-1' });

    await expect(
      getFavoriteState({
        wigId: 'wig-1',
        userId: 'user-1',
      }),
    ).resolves.toEqual({ isFavorited: true });
  });

  it('creates a favorite when not already favorited', async () => {
    mocks.prisma.wig.findUnique.mockResolvedValue({ id: 'wig-1' });
    mocks.prisma.favorite.findUnique.mockResolvedValue(null);
    mocks.prisma.favorite.create.mockResolvedValue({ id: 'fav-1' });

    await expect(
      toggleFavorite({
        wigId: 'wig-1',
        userId: 'user-1',
      }),
    ).resolves.toEqual({ isFavorited: true });

    expect(mocks.prisma.favorite.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        wigId: 'wig-1',
      },
    });
  });

  it('removes a favorite when already favorited', async () => {
    mocks.prisma.wig.findUnique.mockResolvedValue({ id: 'wig-1' });
    mocks.prisma.favorite.findUnique.mockResolvedValue({ id: 'fav-1' });
    mocks.prisma.favorite.delete.mockResolvedValue({ id: 'fav-1' });

    await expect(
      toggleFavorite({
        wigId: 'wig-1',
        userId: 'user-1',
      }),
    ).resolves.toEqual({ isFavorited: false });

    expect(mocks.prisma.favorite.delete).toHaveBeenCalledWith({
      where: {
        userId_wigId: {
          userId: 'user-1',
          wigId: 'wig-1',
        },
      },
    });
  });

  it('returns favorite wigs ordered by latest first', async () => {
    const favorites = [{ createdAt: new Date(), wig: { id: 'wig-1' } }];
    mocks.prisma.favorite.findMany.mockResolvedValue(favorites);

    await expect(getFavoriteWigs('user-1')).resolves.toEqual(favorites);
    expect(mocks.prisma.favorite.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
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
  });
});
