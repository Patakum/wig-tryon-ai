import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: { wig: { findUnique: vi.fn(), update: vi.fn() } },
}));

vi.mock('@/src/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/src/lib/cloudinary-utils', () => ({
  deleteImage: vi.fn(),
  getPublicIdFromUrl: vi.fn(),
  uploadWigFromBuffer: vi.fn(),
}));

import { setWigArchived } from '@/src/services/wig-photo';

describe('setWigArchived', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('archives an available wig', async () => {
    mocks.prisma.wig.findUnique.mockResolvedValue({ id: 'w1', archivedAt: null });
    mocks.prisma.wig.update.mockResolvedValue({ id: 'w1' });

    await setWigArchived('w1', true);

    expect(mocks.prisma.wig.update).toHaveBeenCalledWith({
      where: { id: 'w1' },
      data: { archivedAt: expect.any(Date) },
      select: { id: true, archivedAt: true },
    });
  });

  it('restores an archived wig', async () => {
    mocks.prisma.wig.findUnique.mockResolvedValue({
      id: 'w1',
      archivedAt: new Date(),
    });
    mocks.prisma.wig.update.mockResolvedValue({ id: 'w1' });

    await setWigArchived('w1', false);

    expect(mocks.prisma.wig.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { archivedAt: null } }),
    );
  });

  it('is a no-op when the state already matches', async () => {
    mocks.prisma.wig.findUnique.mockResolvedValue({ id: 'w1', archivedAt: null });

    await setWigArchived('w1', false);

    expect(mocks.prisma.wig.update).not.toHaveBeenCalled();
  });

  it('returns not found for an unknown wig', async () => {
    mocks.prisma.wig.findUnique.mockResolvedValue(null);

    await expect(setWigArchived('missing', true)).rejects.toMatchObject({
      status: 404,
    });
  });
});
