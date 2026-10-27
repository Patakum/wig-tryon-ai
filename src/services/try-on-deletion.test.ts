import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    generation: {
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    feedback: { deleteMany: vi.fn() },
    photo: { update: vi.fn() },
    $transaction: vi.fn(),
  },
  deleteImage: vi.fn(),
}));

vi.mock('@/src/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/src/lib/cloudinary-utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/lib/cloudinary-utils')>()),
  deleteImage: mocks.deleteImage,
}));

import { deleteTryOn } from '@/src/services/try-on-deletion';

const owner = { userId: 'user-a', guestSessionId: null };

const generation = {
  id: 'g1',
  userId: 'user-a',
  guestSessionId: null,
  photoId: 'p1',
  status: 'completed',
  resultImageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/generations/r1.jpg',
  deletedAt: null,
  photo: {
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/wig-ai/s1.jpg',
    deletedAt: null,
  },
};

describe('deleteTryOn', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prisma.generation.findUnique.mockResolvedValue(generation);
    mocks.prisma.generation.count.mockResolvedValue(0);
    mocks.prisma.$transaction.mockResolvedValue([]);
  });

  it('deletes result and unused selfie files, then soft-deletes rows', async () => {
    await deleteTryOn('g1', owner);

    expect(mocks.deleteImage.mock.calls).toEqual([
      ['generations/r1'],
      ['wig-ai/s1'],
    ]);
    expect(mocks.prisma.feedback.deleteMany).toHaveBeenCalledWith({
      where: { generationId: 'g1' },
    });
    expect(mocks.prisma.generation.update).toHaveBeenCalledWith({
      where: { id: 'g1' },
      data: { deletedAt: expect.any(Date), resultImageUrl: null },
    });
    expect(mocks.prisma.photo.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { deletedAt: expect.any(Date), imageUrl: '' },
    });
  });

  it('keeps the selfie when another try-on still uses it', async () => {
    mocks.prisma.generation.count.mockResolvedValue(1);

    await deleteTryOn('g1', owner);

    expect(mocks.deleteImage.mock.calls).toEqual([['generations/r1']]);
    expect(mocks.prisma.photo.update).not.toHaveBeenCalled();
  });

  it('keeps the record when file deletion fails so it can be retried', async () => {
    mocks.deleteImage.mockRejectedValue(new Error('cloudinary down'));

    await expect(deleteTryOn('g1', owner)).rejects.toMatchObject({
      status: 502,
      code: 'DELETE_FAILED',
    });
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it('refuses unrecognized image urls instead of leaving files behind', async () => {
    mocks.prisma.generation.findUnique.mockResolvedValue({
      ...generation,
      resultImageUrl: 'https://elsewhere.example/r.jpg',
    });

    await expect(deleteTryOn('g1', owner)).rejects.toMatchObject({ status: 502 });
    expect(mocks.deleteImage).not.toHaveBeenCalled();
  });

  it('rejects another customer', async () => {
    await expect(
      deleteTryOn('g1', { userId: 'user-b', guestSessionId: null }),
    ).rejects.toMatchObject({ status: 403 });
    expect(mocks.deleteImage).not.toHaveBeenCalled();
  });

  it('requires sign-in', async () => {
    await expect(
      deleteTryOn('g1', { userId: null, guestSessionId: 'guest' }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('refuses to delete a pending generation', async () => {
    mocks.prisma.generation.findUnique.mockResolvedValue({
      ...generation,
      status: 'pending',
    });

    await expect(deleteTryOn('g1', owner)).rejects.toMatchObject({ status: 409 });
  });

  it('treats an already deleted or unknown try-on as not found', async () => {
    mocks.prisma.generation.findUnique.mockResolvedValue({
      ...generation,
      deletedAt: new Date(),
    });
    await expect(deleteTryOn('g1', owner)).rejects.toMatchObject({ status: 404 });

    mocks.prisma.generation.findUnique.mockResolvedValue(null);
    await expect(deleteTryOn('g1', owner)).rejects.toMatchObject({ status: 404 });
  });
});
