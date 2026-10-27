import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    photo: { findUnique: vi.fn() },
    wig: { findUnique: vi.fn() },
    generation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    feedback: { upsert: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
  },
  openAiEdit: vi.fn(),
  segmentHair: vi.fn(),
  uploadGeneration: vi.fn(),
}));

vi.mock('@/src/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    images: { edit: mocks.openAiEdit },
  })),
  toFile: vi.fn(),
}));
vi.mock('@/src/lib/replicate', () => ({
  segmentHair: mocks.segmentHair,
}));
vi.mock('@/src/lib/cloudinary-utils', () => ({
  uploadGeneration: mocks.uploadGeneration,
}));

import {
  createFeedbackForGeneration,
  getGenerationCreationAccess,
  createPendingGeneration,
  getFeedbackMessage,
  getGenerationForViewer,
} from '@/src/services/generation';
import { getPhotoForViewer } from '@/src/services/photo';
import type { ViewerIdentity } from '@/src/types/viewer';

const photo = {
  id: 'photo-1',
  userId: 'customer-a',
  guestSessionId: null,
  imageUrl: 'https://images.example/selfie.jpg',
};

const generation = {
  id: 'generation-1',
  userId: 'customer-a',
  guestSessionId: null,
  photoId: 'photo-1',
  wigId: 'wig-1',
  status: 'completed',
};

describe('photo ownership', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns an owned photo', async () => {
    mocks.prisma.photo.findUnique.mockResolvedValue(photo);

    await expect(
      getPhotoForViewer('photo-1', {
        userId: 'customer-a',
        guestSessionId: null,
      }),
    ).resolves.toEqual(photo);
  });

  it('rejects another customer from reading a photo', async () => {
    mocks.prisma.photo.findUnique.mockResolvedValue(photo);

    await expect(
      getPhotoForViewer('photo-1', {
        userId: 'customer-b',
        guestSessionId: null,
      }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  it('allows a guest to read only a photo bound to the same guest session', async () => {
    mocks.prisma.photo.findUnique.mockResolvedValue({
      ...photo,
      userId: null,
      guestSessionId: 'guest-a',
    });

    await expect(
      getPhotoForViewer('photo-1', {
        userId: null,
        guestSessionId: 'guest-a',
      }),
    ).resolves.toMatchObject({ guestSessionId: 'guest-a' });

    mocks.prisma.photo.findUnique.mockResolvedValue({
      ...photo,
      userId: null,
      guestSessionId: 'guest-a',
    });
    await expect(
      getPhotoForViewer('photo-1', {
        userId: null,
        guestSessionId: 'guest-b',
      }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  it('requires sign-in to read a customer photo', async () => {
    mocks.prisma.photo.findUnique.mockResolvedValue(photo);

    await expect(
      getPhotoForViewer('photo-1', {
        userId: null,
        guestSessionId: 'guest-a',
      }),
    ).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
  });

  it('returns not found for an unknown photo', async () => {
    mocks.prisma.photo.findUnique.mockResolvedValue(null);

    await expect(
      getPhotoForViewer('missing-photo', {
        userId: null,
        guestSessionId: null,
      }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });

  it('rejects legacy photos without an owner', async () => {
    mocks.prisma.photo.findUnique.mockResolvedValue({
      ...photo,
      userId: null,
      guestSessionId: null,
    });

    await expect(
      getPhotoForViewer('photo-1', {
        userId: null,
        guestSessionId: 'guest-a',
      }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });
});

describe('generation ownership and setup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prisma.$transaction.mockImplementation(
      (callback: (tx: typeof mocks.prisma) => unknown) =>
        callback(mocks.prisma),
    );
    mocks.prisma.generation.count.mockResolvedValue(0);
  });

  it('returns a generation to its owner', async () => {
    mocks.prisma.generation.findUnique.mockResolvedValue(generation);

    await expect(
      getGenerationForViewer('generation-1', {
        userId: 'customer-a',
        guestSessionId: null,
      }),
    ).resolves.toEqual(generation);
  });

  it('rejects another customer from reading a generation', async () => {
    mocks.prisma.generation.findUnique.mockResolvedValue(generation);

    await expect(
      getGenerationForViewer('generation-1', {
        userId: 'customer-b',
        guestSessionId: null,
      }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  it('does not create a generation from another customer’s photo', async () => {
    mocks.prisma.photo.findUnique.mockResolvedValue(photo);
    mocks.prisma.wig.findUnique.mockResolvedValue({ id: 'wig-1' });

    await expect(
      createPendingGeneration({
        photoId: 'photo-1',
        wigId: 'wig-1',
        viewer: { userId: 'customer-b', guestSessionId: null },
      }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });

    expect(mocks.prisma.generation.create).not.toHaveBeenCalled();
  });

  it('rejects feedback from a customer who does not own the generation', async () => {
    mocks.prisma.generation.findUnique.mockResolvedValue(generation);

    await expect(
      createFeedbackForGeneration({
        generationId: 'generation-1',
        viewer: { userId: 'customer-b', guestSessionId: null },
        message: 'Feedback',
      }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });

    expect(mocks.prisma.feedback.upsert).not.toHaveBeenCalled();
  });

  it('creates or updates the single feedback record for the owner', async () => {
    mocks.prisma.generation.findUnique.mockResolvedValue({
      userId: 'customer-a',
      guestSessionId: null,
      deletedAt: null,
    });

    await createFeedbackForGeneration({
      generationId: 'generation-1',
      viewer: { userId: 'customer-a', guestSessionId: null },
      message: 'Updated',
    });

    expect(mocks.prisma.feedback.upsert).toHaveBeenCalledWith({
      where: { generationId: 'generation-1' },
      create: {
        generationId: 'generation-1',
        userId: 'customer-a',
        message: 'Updated',
      },
      update: { message: 'Updated' },
    });
  });

  it('requires sign-in and an undeleted generation for feedback', async () => {
    await expect(
      createFeedbackForGeneration({
        generationId: 'generation-1',
        viewer: { userId: null, guestSessionId: 'guest-a' },
        message: 'Hi',
      }),
    ).rejects.toMatchObject({ status: 401 });

    mocks.prisma.generation.findUnique.mockResolvedValue({
      userId: 'customer-a',
      guestSessionId: null,
      deletedAt: new Date(),
    });
    await expect(
      createFeedbackForGeneration({
        generationId: 'generation-1',
        viewer: { userId: 'customer-a', guestSessionId: null },
        message: 'Hi',
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('returns the saved feedback message or an empty string', async () => {
    mocks.prisma.feedback.findUnique.mockResolvedValueOnce({ message: 'Nice' });
    mocks.prisma.feedback.findUnique.mockResolvedValueOnce(null);

    await expect(getFeedbackMessage('generation-1')).resolves.toBe('Nice');
    await expect(getFeedbackMessage('generation-1')).resolves.toBe('');
  });

  it('creates a pending generation for the photo owner without calling providers', async () => {
    mocks.prisma.photo.findUnique.mockResolvedValue(photo);
    mocks.prisma.wig.findUnique.mockResolvedValue({ id: 'wig-1' });
    mocks.prisma.generation.create.mockResolvedValue({ id: 'generation-2' });

    await expect(
      createPendingGeneration({
        photoId: 'photo-1',
        wigId: 'wig-1',
        viewer: { userId: 'customer-a', guestSessionId: null },
      }),
    ).resolves.toEqual({ generationId: 'generation-2' });

    expect(mocks.prisma.generation.create).toHaveBeenCalledWith({
      data: {
        userId: 'customer-a',
        guestSessionId: null,
        photoId: 'photo-1',
        wigId: 'wig-1',
        status: 'pending',
      },
    });
    expect(mocks.openAiEdit).not.toHaveBeenCalled();
    expect(mocks.segmentHair).not.toHaveBeenCalled();
    expect(mocks.uploadGeneration).not.toHaveBeenCalled();
  });

  it('preserves guest ownership when creating a guest generation', async () => {
    const viewer: ViewerIdentity = {
      userId: null,
      guestSessionId: 'guest-a',
    };
    mocks.prisma.photo.findUnique.mockResolvedValue({
      ...photo,
      userId: null,
      guestSessionId: 'guest-a',
    });
    mocks.prisma.wig.findUnique.mockResolvedValue({ id: 'wig-1' });
    mocks.prisma.generation.findFirst.mockResolvedValue(null);
    mocks.prisma.generation.create.mockResolvedValue({ id: 'generation-2' });

    await createPendingGeneration({
      photoId: 'photo-1',
      wigId: 'wig-1',
      viewer,
    });

    expect(mocks.prisma.generation.create).toHaveBeenCalledWith({
      data: {
        userId: null,
        guestSessionId: 'guest-a',
        photoId: 'photo-1',
        wigId: 'wig-1',
        status: 'pending',
      },
    });
  });

  it('rejects a second pending generation from the same guest browser', async () => {
    const viewer: ViewerIdentity = {
      userId: null,
      guestSessionId: 'guest-a',
    };
    mocks.prisma.photo.findUnique.mockResolvedValue({
      ...photo,
      userId: null,
      guestSessionId: 'guest-a',
    });
    mocks.prisma.wig.findUnique.mockResolvedValue({ id: 'wig-1' });
    mocks.prisma.generation.findFirst.mockResolvedValue({
      id: 'generation-1',
      status: 'completed',
    });

    await expect(
      createPendingGeneration({
        photoId: 'photo-1',
        wigId: 'wig-1',
        viewer,
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: 'GENERATION_LOGIN_REQUIRED',
    });

    expect(mocks.prisma.generation.create).not.toHaveBeenCalled();
  });

  it('returns login requirement for a guest who already generated once', async () => {
    mocks.prisma.generation.findFirst.mockResolvedValue({ id: 'generation-1' });

    await expect(
      getGenerationCreationAccess({
        userId: null,
        guestSessionId: 'guest-a',
      }),
    ).resolves.toEqual({
      canCreateGeneration: false,
      requiresLoginToGenerateAgain: true,
      message: 'You already used your guest generation. Sign in to generate again.',
    });
  });

  it('does not count failed generations against the guest allowance', async () => {
    mocks.prisma.generation.findFirst.mockResolvedValue(null);

    await expect(
      getGenerationCreationAccess({ userId: null, guestSessionId: 'guest-a' }),
    ).resolves.toMatchObject({ canCreateGeneration: true });

    expect(mocks.prisma.generation.findFirst).toHaveBeenCalledWith({
      where: { guestSessionId: 'guest-a', status: { not: 'failed' } },
      select: { id: true },
    });
  });

  it('expires stale pending generations before checking the allowance', async () => {
    mocks.prisma.generation.findFirst.mockResolvedValue(null);

    await getGenerationCreationAccess({
      userId: 'customer-a',
      guestSessionId: null,
    });

    expect(mocks.prisma.generation.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'customer-a',
        status: 'pending',
        createdAt: { lt: expect.any(Date) },
      },
      data: { status: 'failed' },
    });
  });

  it('blocks a signed-in user who reached the daily limit', async () => {
    mocks.prisma.generation.findFirst.mockResolvedValue(null);
    mocks.prisma.generation.count.mockResolvedValue(3);

    await expect(
      getGenerationCreationAccess({
        userId: 'customer-a',
        guestSessionId: null,
      }),
    ).resolves.toMatchObject({
      canCreateGeneration: false,
      requiresLoginToGenerateAgain: false,
    });
  });

  it('takes a per-owner lock and creates nothing when the limit is reached', async () => {
    mocks.prisma.photo.findUnique.mockResolvedValue(photo);
    mocks.prisma.wig.findUnique.mockResolvedValue({ id: 'wig-1' });
    mocks.prisma.generation.findFirst.mockResolvedValue(null);
    mocks.prisma.generation.count.mockResolvedValue(3);

    await expect(
      createPendingGeneration({
        photoId: 'photo-1',
        wigId: 'wig-1',
        viewer: { userId: 'customer-a', guestSessionId: null },
      }),
    ).rejects.toMatchObject({ status: 409, code: 'GENERATION_LIMIT_REACHED' });

    expect(mocks.prisma.$executeRaw).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.generation.create).not.toHaveBeenCalled();
  });

  it('returns a pending-generation message for signed-in users', async () => {
    mocks.prisma.generation.findFirst.mockResolvedValue({ id: 'generation-1' });

    await expect(
      getGenerationCreationAccess({
        userId: 'customer-a',
        guestSessionId: null,
      }),
    ).resolves.toEqual({
      canCreateGeneration: false,
      requiresLoginToGenerateAgain: false,
      message: 'You already have a generation in progress.',
    });
  });
});
