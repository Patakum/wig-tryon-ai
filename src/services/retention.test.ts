import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    generation: { findMany: vi.fn(), delete: vi.fn() },
    photo: { findMany: vi.fn(), delete: vi.fn() },
    feedback: { deleteMany: vi.fn() },
    guestSession: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
  purgeStoredImages: vi.fn(),
}));

vi.mock('@/src/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/src/services/try-on-deletion', () => ({
  purgeStoredImages: mocks.purgeStoredImages,
}));

import { runRetentionCleanup } from '@/src/services/retention';

const NOW = new Date('2026-11-03T12:00:00Z');
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000);
const daysAgo = (d: number) => hoursAgo(d * 24);

describe('runRetentionCleanup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prisma.generation.findMany.mockResolvedValue([]);
    mocks.prisma.photo.findMany.mockResolvedValue([]);
    mocks.prisma.guestSession.deleteMany.mockResolvedValue({ count: 0 });
    mocks.prisma.$transaction.mockResolvedValue([]);
  });

  it('selects guest data after 24h, account data after 12 months and old tombstones', async () => {
    await runRetentionCleanup(NOW);

    const { OR } = mocks.prisma.generation.findMany.mock.calls[0][0].where;

    expect(OR).toEqual([
      {
        userId: null,
        guestSessionId: { not: null },
        createdAt: { lt: hoursAgo(24) },
      },
      { userId: { not: null }, createdAt: { lt: daysAgo(365) } },
      { deletedAt: { lt: hoursAgo(48) } },
    ]);
  });

  it('only removes expired photos that no try-on references any more', async () => {
    await runRetentionCleanup(NOW);

    expect(mocks.prisma.photo.findMany.mock.calls[0][0].where.generations).toEqual({
      none: {},
    });
  });

  it('deletes files first, then feedback and the generation row', async () => {
    mocks.prisma.generation.findMany.mockResolvedValue([
      { id: 'g1', resultImageUrl: 'https://x/r.jpg', resultPublicId: 'generations/r' },
    ]);
    const order: string[] = [];
    mocks.purgeStoredImages.mockImplementation(async () => {
      order.push('files');
    });
    mocks.prisma.$transaction.mockImplementation(async () => {
      order.push('rows');
      return [];
    });

    const summary = await runRetentionCleanup(NOW);

    expect(order).toEqual(['files', 'rows']);
    expect(mocks.purgeStoredImages).toHaveBeenCalledWith([
      { imageUrl: 'https://x/r.jpg', publicId: 'generations/r' },
    ]);
    expect(mocks.prisma.feedback.deleteMany).toHaveBeenCalledWith({
      where: { generationId: 'g1' },
    });
    expect(mocks.prisma.generation.delete).toHaveBeenCalledWith({
      where: { id: 'g1' },
    });
    expect(summary.generationsDeleted).toBe(1);
  });

  it('keeps a row and retries next run when its file cannot be deleted', async () => {
    mocks.prisma.generation.findMany.mockResolvedValue([
      { id: 'g1', resultImageUrl: 'u', resultPublicId: 'p' },
      { id: 'g2', resultImageUrl: 'u2', resultPublicId: 'p2' },
    ]);
    mocks.purgeStoredImages.mockRejectedValueOnce(new Error('cloudinary down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const summary = await runRetentionCleanup(NOW);

    expect(summary).toMatchObject({ generationsDeleted: 1, failures: 1 });
    expect(mocks.prisma.generation.delete).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.generation.delete).toHaveBeenCalledWith({
      where: { id: 'g2' },
    });
  });

  it('skips file deletion for tombstones and deletes expired photos', async () => {
    mocks.prisma.generation.findMany.mockResolvedValue([
      { id: 'tomb', resultImageUrl: null, resultPublicId: null },
    ]);
    mocks.prisma.photo.findMany.mockResolvedValue([
      { id: 'p1', imageUrl: 'https://x/s.jpg', imagePublicId: 'wig-ai/s' },
      { id: 'p-tomb', imageUrl: '', imagePublicId: null },
    ]);

    const summary = await runRetentionCleanup(NOW);

    expect(mocks.purgeStoredImages.mock.calls).toEqual([
      [[]],
      [[{ imageUrl: 'https://x/s.jpg', publicId: 'wig-ai/s' }]],
      [[]],
    ]);
    expect(mocks.prisma.photo.delete).toHaveBeenCalledTimes(2);
    expect(summary).toMatchObject({ generationsDeleted: 1, photosDeleted: 2 });
  });

  it('removes expired guest sessions that no longer own data', async () => {
    mocks.prisma.guestSession.deleteMany.mockResolvedValue({ count: 3 });

    const summary = await runRetentionCleanup(NOW);

    expect(mocks.prisma.guestSession.deleteMany).toHaveBeenCalledWith({
      where: {
        expiresAt: { lt: NOW },
        photos: { none: {} },
        generations: { none: {} },
      },
    });
    expect(summary.guestSessionsDeleted).toBe(3);
  });
});
