import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: {
    photo: { findUnique: vi.fn() },
    wig: { findUnique: vi.fn() },
    generation: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    feedback: { create: vi.fn() },
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
  createPendingGeneration,
  getGenerationForViewer,
} from '@/src/services/generation';
import { getPhotoForViewer } from '@/src/services/photo';

const photo = {
  id: 'photo-1',
  userId: 'customer-a',
  imageUrl: 'https://images.example/selfie.jpg',
};

const generation = {
  id: 'generation-1',
  userId: 'customer-a',
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

    await expect(getPhotoForViewer('photo-1', 'customer-a')).resolves.toEqual(
      photo,
    );
  });

  it('rejects another customer from reading a photo', async () => {
    mocks.prisma.photo.findUnique.mockResolvedValue(photo);

    await expect(
      getPhotoForViewer('photo-1', 'customer-b'),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  it('allows a guest to read only an unowned guest photo', async () => {
    mocks.prisma.photo.findUnique.mockResolvedValue({
      ...photo,
      userId: null,
    });

    await expect(getPhotoForViewer('photo-1', null)).resolves.toMatchObject({
      userId: null,
    });

    mocks.prisma.photo.findUnique.mockResolvedValue(photo);
    await expect(
      getPhotoForViewer('photo-1', null),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  it('returns not found for an unknown photo', async () => {
    mocks.prisma.photo.findUnique.mockResolvedValue(null);

    await expect(
      getPhotoForViewer('missing-photo', null),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' });
  });
});

describe('generation ownership and setup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns a generation to its owner', async () => {
    mocks.prisma.generation.findUnique.mockResolvedValue(generation);

    await expect(
      getGenerationForViewer('generation-1', 'customer-a'),
    ).resolves.toEqual(generation);
  });

  it('rejects another customer from reading a generation', async () => {
    mocks.prisma.generation.findUnique.mockResolvedValue(generation);

    await expect(
      getGenerationForViewer('generation-1', 'customer-b'),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  it('does not create a generation from another customer’s photo', async () => {
    mocks.prisma.photo.findUnique.mockResolvedValue(photo);
    mocks.prisma.wig.findUnique.mockResolvedValue({ id: 'wig-1' });

    await expect(
      createPendingGeneration({
        photoId: 'photo-1',
        wigId: 'wig-1',
        viewerUserId: 'customer-b',
      }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });

    expect(mocks.prisma.generation.create).not.toHaveBeenCalled();
  });

  it('rejects feedback from a customer who does not own the generation', async () => {
    mocks.prisma.generation.findUnique.mockResolvedValue(generation);

    await expect(
      createFeedbackForGeneration({
        generationId: 'generation-1',
        userId: 'customer-b',
        message: 'Feedback',
      }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });

    expect(mocks.prisma.feedback.create).not.toHaveBeenCalled();
  });

  it('creates a pending generation for the photo owner without calling providers', async () => {
    mocks.prisma.photo.findUnique.mockResolvedValue(photo);
    mocks.prisma.wig.findUnique.mockResolvedValue({ id: 'wig-1' });
    mocks.prisma.generation.create.mockResolvedValue({ id: 'generation-2' });

    await expect(
      createPendingGeneration({
        photoId: 'photo-1',
        wigId: 'wig-1',
        viewerUserId: 'customer-a',
      }),
    ).resolves.toEqual({ generationId: 'generation-2' });

    expect(mocks.prisma.generation.create).toHaveBeenCalledWith({
      data: {
        userId: 'customer-a',
        photoId: 'photo-1',
        wigId: 'wig-1',
        status: 'pending',
      },
    });
    expect(mocks.openAiEdit).not.toHaveBeenCalled();
    expect(mocks.segmentHair).not.toHaveBeenCalled();
    expect(mocks.uploadGeneration).not.toHaveBeenCalled();
  });
});
