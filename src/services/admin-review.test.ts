import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    generation: { findUnique: vi.fn(), update: vi.fn() },
    feedback: { findMany: vi.fn() },
  },
  fetchStoredImage: vi.fn(),
}));

vi.mock('@/src/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/src/lib/cloudinary-utils', () => ({
  fetchStoredImage: mocks.fetchStoredImage,
}));

import {
  getAdminImage,
  getFeedbackForAdmin,
  updateAdminVisibility,
} from '@/src/services/admin-review';

const generation = {
  deletedAt: null,
  resultImageUrl: 'https://res.cloudinary.com/demo/image/authenticated/v1/r.jpg',
  resultPublicId: 'generations/r',
  adminCanSeeSelfie: true,
  adminCanSeeResult: true,
  photo: {
    imageUrl: 'https://res.cloudinary.com/demo/image/authenticated/v1/s.jpg',
    imagePublicId: 'wig-ai/s',
  },
};

describe('admin image access', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.fetchStoredImage.mockResolvedValue({ body: 'stream', contentType: 'image/jpeg' });
  });

  it('serves the result and selfie through signed references when allowed', async () => {
    mocks.prisma.generation.findUnique.mockResolvedValue(generation);

    await getAdminImage('g1', 'result');
    await getAdminImage('g1', 'selfie');

    expect(mocks.fetchStoredImage.mock.calls).toEqual([
      [{ imageUrl: generation.resultImageUrl, publicId: 'generations/r' }],
      [{ imageUrl: generation.photo.imageUrl, publicId: 'wig-ai/s' }],
    ]);
  });

  it('refuses images the customer hid, per image', async () => {
    mocks.prisma.generation.findUnique.mockResolvedValue({
      ...generation,
      adminCanSeeSelfie: false,
    });

    await expect(getAdminImage('g1', 'selfie')).rejects.toMatchObject({
      status: 403,
      code: 'HIDDEN_BY_CUSTOMER',
    });
    await expect(getAdminImage('g1', 'result')).resolves.toBeDefined();
    expect(mocks.fetchStoredImage).toHaveBeenCalledTimes(1);
  });

  it('returns not found for deleted or unknown generations and missing images', async () => {
    mocks.prisma.generation.findUnique.mockResolvedValue(null);
    await expect(getAdminImage('g1', 'result')).rejects.toMatchObject({ status: 404 });

    mocks.prisma.generation.findUnique.mockResolvedValue({
      ...generation,
      deletedAt: new Date(),
    });
    await expect(getAdminImage('g1', 'result')).rejects.toMatchObject({ status: 404 });

    mocks.prisma.generation.findUnique.mockResolvedValue({
      ...generation,
      resultImageUrl: null,
      resultPublicId: null,
    });
    await expect(getAdminImage('g1', 'result')).rejects.toMatchObject({ status: 404 });
  });
});

describe('feedback list for admins', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('exposes visibility flags, never image links', async () => {
    mocks.prisma.feedback.findMany.mockResolvedValue([
      {
        id: 'f1',
        message: 'hi',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { email: 'a@x.y' },
        generation: {
          id: 'g1',
          status: 'completed',
          resultImageUrl: 'https://res.cloudinary.com/demo/image/authenticated/v1/r.jpg',
          resultPublicId: 'generations/r',
          adminCanSeeSelfie: false,
          adminCanSeeResult: true,
          photo: { imageUrl: 'u', imagePublicId: 'p' },
          wig: { name: 'W', imageUrl: 'https://res.cloudinary.com/demo/image/upload/w.jpg' },
        },
      },
    ]);

    const [entry] = await getFeedbackForAdmin();

    expect(entry.generation.selfie).toEqual({ visible: false, hiddenByCustomer: true });
    expect(entry.generation.result).toEqual({ visible: true, hiddenByCustomer: false });
    expect(JSON.stringify(entry)).not.toContain('authenticated');
    expect(JSON.stringify(entry)).not.toContain('generations/r');
  });
});

describe('updateAdminVisibility', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prisma.generation.findUnique.mockResolvedValue({
      userId: 'user-a',
      guestSessionId: null,
      deletedAt: null,
    });
    mocks.prisma.generation.update.mockResolvedValue({});
  });

  it('lets the owner change one setting without touching the other', async () => {
    await updateAdminVisibility(
      'g1',
      { userId: 'user-a', guestSessionId: null },
      { adminCanSeeSelfie: false },
    );

    expect(mocks.prisma.generation.update).toHaveBeenCalledWith({
      where: { id: 'g1' },
      data: { adminCanSeeSelfie: false },
      select: { adminCanSeeSelfie: true, adminCanSeeResult: true },
    });
  });

  it('rejects other customers, guests and deleted try-ons', async () => {
    await expect(
      updateAdminVisibility(
        'g1',
        { userId: 'user-b', guestSessionId: null },
        { adminCanSeeResult: false },
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      updateAdminVisibility(
        'g1',
        { userId: null, guestSessionId: 'guest' },
        { adminCanSeeResult: false },
      ),
    ).rejects.toMatchObject({ status: 401 });

    mocks.prisma.generation.findUnique.mockResolvedValue({
      userId: 'user-a',
      guestSessionId: null,
      deletedAt: new Date(),
    });
    await expect(
      updateAdminVisibility(
        'g1',
        { userId: 'user-a', guestSessionId: null },
        { adminCanSeeResult: false },
      ),
    ).rejects.toMatchObject({ status: 404 });
    expect(mocks.prisma.generation.update).not.toHaveBeenCalled();
  });
});
