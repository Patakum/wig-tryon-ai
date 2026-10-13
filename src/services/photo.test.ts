import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
    photo: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    generation: {
      updateMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/src/lib/prisma', () => ({
  prisma: mocks.prisma,
}));

import { transferGuestOwnershipToUser } from './photo';

describe('transferGuestOwnershipToUser', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prisma.$transaction.mockImplementation(
      async (
        callback: (tx: {
          photo: {
            updateMany: typeof mocks.prisma.photo.updateMany;
            findFirst: typeof mocks.prisma.photo.findFirst;
          };
          generation: {
            updateMany: typeof mocks.prisma.generation.updateMany;
            findFirst: typeof mocks.prisma.generation.findFirst;
          };
        }) => Promise<unknown>,
      ) =>
        callback({
          photo: {
            updateMany: mocks.prisma.photo.updateMany,
            findFirst: mocks.prisma.photo.findFirst,
          },
          generation: {
            updateMany: mocks.prisma.generation.updateMany,
            findFirst: mocks.prisma.generation.findFirst,
          },
        }),
    );
  });

  it('moves guest-owned photos and generations to a signed-in user', async () => {
    mocks.prisma.photo.findFirst.mockResolvedValue(null);
    mocks.prisma.generation.findFirst.mockResolvedValue(null);
    mocks.prisma.photo.updateMany.mockResolvedValue({ count: 2 });
    mocks.prisma.generation.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      transferGuestOwnershipToUser({
        userId: 'user-a',
        guestSessionId: 'guest-a',
      }),
    ).resolves.toEqual({
      transferredPhotoCount: 2,
      transferredGenerationCount: 1,
    });

    expect(mocks.prisma.photo.updateMany).toHaveBeenCalledWith({
      where: {
        userId: null,
        guestSessionId: 'guest-a',
      },
      data: {
        userId: 'user-a',
      },
    });
    expect(mocks.prisma.generation.updateMany).toHaveBeenCalledWith({
      where: {
        userId: null,
        guestSessionId: 'guest-a',
      },
      data: {
        userId: 'user-a',
      },
    });
    expect(mocks.prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('is idempotent when ownership is already transferred', async () => {
    mocks.prisma.photo.findFirst.mockResolvedValue(null);
    mocks.prisma.generation.findFirst.mockResolvedValue(null);
    mocks.prisma.photo.updateMany.mockResolvedValue({ count: 0 });
    mocks.prisma.generation.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      transferGuestOwnershipToUser({
        userId: 'user-a',
        guestSessionId: 'guest-a',
      }),
    ).resolves.toEqual({
      transferredPhotoCount: 0,
      transferredGenerationCount: 0,
    });
  });

  it('rejects claiming a guest session that is already linked to another account', async () => {
    mocks.prisma.photo.findFirst.mockResolvedValue({ id: 'photo-claimed' });
    mocks.prisma.generation.findFirst.mockResolvedValue(null);

    await expect(
      transferGuestOwnershipToUser({
        userId: 'user-b',
        guestSessionId: 'guest-a',
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
      message: 'This guest session is already linked to a different account.',
    });

    expect(mocks.prisma.photo.updateMany).not.toHaveBeenCalled();
    expect(mocks.prisma.generation.updateMany).not.toHaveBeenCalled();
  });
});
