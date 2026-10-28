import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: { wig: { create: vi.fn(), update: vi.fn() } },
}));

vi.mock('@/src/lib/prisma', () => ({ prisma: mocks.prisma }));
vi.mock('@/src/lib/cloudinary-utils', () => ({ uploadWigFromBuffer: vi.fn() }));

import { createWig, updateWig } from './wig';

describe('wig writes', () => {
  beforeEach(() => vi.resetAllMocks());

  it('trims the name and stores an empty description as null', async () => {
    await createWig({
      name: '  Bob  ',
      description: '',
      price: null,
      imageUrl: 'https://img/1.jpg',
    });

    expect(mocks.prisma.wig.create).toHaveBeenCalledWith({
      data: {
        name: 'Bob',
        description: null,
        price: null,
        imageUrl: 'https://img/1.jpg',
      },
    });
  });

  it('keeps the current image when editing without a new one', async () => {
    await updateWig('wig-1', { name: 'Bob', description: 'Short', price: 90 });

    const { data } = mocks.prisma.wig.update.mock.calls[0][0];
    expect(data).toEqual({ name: 'Bob', description: 'Short', price: 90 });
    expect(data).not.toHaveProperty('imageUrl');
  });

  it('replaces the image and clears the price when asked', async () => {
    await updateWig('wig-1', {
      name: 'Bob',
      price: null,
      imageUrl: 'https://img/2.jpg',
    });

    expect(mocks.prisma.wig.update).toHaveBeenCalledWith({
      where: { id: 'wig-1' },
      data: {
        name: 'Bob',
        description: null,
        price: null,
        imageUrl: 'https://img/2.jpg',
      },
    });
  });
});
