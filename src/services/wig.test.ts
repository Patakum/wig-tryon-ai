import { beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';

const mocks = vi.hoisted(() => ({
  prisma: { wig: { findUnique: vi.fn(), create: vi.fn() } },
}));

vi.mock('@/src/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/src/lib/cloudinary-utils', () => ({
  uploadWigFromBuffer: vi.fn(),
}));

import {
  assertValidWigImage,
  createWig,
  getWig,
  MAX_WIG_IMAGE_BYTES,
} from '@/src/services/wig';

async function image(format: 'jpeg' | 'png' | 'gif') {
  const base = sharp({
    create: {
      width: 8,
      height: 8,
      channels: 3,
      background: { r: 200, g: 100, b: 50 },
    },
  });

  return format === 'jpeg'
    ? base.jpeg().toBuffer()
    : format === 'png'
      ? base.png().toBuffer()
      : base.gif().toBuffer();
}

describe('assertValidWigImage', () => {
  it('accepts real JPEG and PNG content', async () => {
    await expect(assertValidWigImage(await image('jpeg'))).resolves.toBeUndefined();
    await expect(assertValidWigImage(await image('png'))).resolves.toBeUndefined();
  });

  it('rejects non-image bytes even if the client claimed an image type', async () => {
    await expect(
      assertValidWigImage(Buffer.from('<script>alert(1)</script>')),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects unsupported formats, empty files and oversize files', async () => {
    await expect(assertValidWigImage(await image('gif'))).rejects.toMatchObject({
      status: 400,
    });
    await expect(assertValidWigImage(Buffer.alloc(0))).rejects.toMatchObject({
      status: 400,
    });
    await expect(
      assertValidWigImage(Buffer.alloc(MAX_WIG_IMAGE_BYTES + 1)),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('wig photos', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('creates a new wig with its image as the main photo', async () => {
    mocks.prisma.wig.create.mockResolvedValue({ id: 'w1' });

    await createWig({
      name: ' Wig ',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg',
      description: null,
      price: null,
    });

    expect(mocks.prisma.wig.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Wig',
        photos: {
          create: {
            imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg',
            position: 0,
          },
        },
      }),
    });
  });

  it('falls back to the single image for wigs without photo rows', async () => {
    mocks.prisma.wig.findUnique.mockResolvedValue({
      id: 'w1',
      name: 'Old',
      imageUrl: 'https://x/a.jpg',
      price: null,
      description: null,
      photos: [],
    });

    const wig = await getWig('w1');

    expect(wig?.photos).toEqual([{ id: 'main', imageUrl: 'https://x/a.jpg' }]);
  });

  it('returns null for an unknown wig', async () => {
    mocks.prisma.wig.findUnique.mockResolvedValue(null);

    await expect(getWig('missing')).resolves.toBeNull();
  });
});
