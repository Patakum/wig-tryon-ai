import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  prisma: { wig: { findMany: vi.fn() } },
}));

vi.mock('@/src/lib/prisma', () => ({ prisma: mocks.prisma }));

import {
  catalogQuerySchema,
  parseCatalogSearchParams,
  searchWigs,
} from '@/src/services/catalog';

const wig = (id: string) => ({ id, name: id, imageUrl: 'u', price: 1 });

describe('catalog query parsing', () => {
  it('applies defaults and trims the search text', () => {
    expect(catalogQuerySchema.parse({ q: '  bob  ' })).toMatchObject({
      q: 'bob',
      sort: 'newest',
    });
  });

  it('treats blank price fields as unset and coerces numbers', () => {
    const parsed = catalogQuerySchema.parse({ min: '', max: '800' });

    expect(parsed.min).toBeUndefined();
    expect(parsed.max).toBe(800);
  });

  it('rejects inverted ranges, negative prices and unknown sorts', () => {
    expect(catalogQuerySchema.safeParse({ min: '9', max: '1' }).success).toBe(false);
    expect(catalogQuerySchema.safeParse({ min: '-1' }).success).toBe(false);
    expect(catalogQuerySchema.safeParse({ sort: 'cheapest' }).success).toBe(false);
  });

  it('falls back to defaults for invalid page URLs instead of failing', () => {
    expect(
      parseCatalogSearchParams({ min: 'abc', sort: 'nope', q: ['a', 'b'] }),
    ).toEqual({ sort: 'newest' });
    expect(parseCatalogSearchParams({ q: ['a', 'b'] }).q).toBe('a');
  });
});

describe('searchWigs', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.prisma.wig.findMany.mockResolvedValue([]);
  });

  it('only returns unarchived wigs and escapes LIKE wildcards', async () => {
    const escaped = String.raw`100\%\_x`;

    await searchWigs(catalogQuerySchema.parse({ q: '100%_x' }));

    const args = mocks.prisma.wig.findMany.mock.calls[0][0];
    expect(args.where.archivedAt).toBeNull();
    expect(args.where.OR[0].name).toEqual({
      contains: escaped,
      mode: 'insensitive',
    });
    expect(args.where.OR[1].description.contains).toBe(escaped);
  });

  it('adds a price filter only when a bound is given', async () => {
    await searchWigs(catalogQuerySchema.parse({}));
    expect(mocks.prisma.wig.findMany.mock.calls[0][0].where.price).toBeUndefined();

    await searchWigs(catalogQuerySchema.parse({ min: '100', max: '500' }));
    expect(mocks.prisma.wig.findMany.mock.calls[1][0].where.price).toEqual({
      gte: 100,
      lte: 500,
    });
  });

  it('orders by sort with a deterministic id tiebreaker', async () => {
    await searchWigs(catalogQuerySchema.parse({ sort: 'price_asc' }));

    expect(mocks.prisma.wig.findMany.mock.calls[0][0].orderBy).toEqual([
      { price: { sort: 'asc', nulls: 'last' } },
      { id: 'asc' },
    ]);
  });

  it('returns a next cursor only when more rows exist and passes the cursor', async () => {
    mocks.prisma.wig.findMany.mockResolvedValue([wig('a'), wig('b'), wig('c')]);

    const page = await searchWigs(catalogQuerySchema.parse({ cursor: 'z' }), 2);

    expect(page.items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(page.nextCursor).toBe('b');
    expect(mocks.prisma.wig.findMany.mock.calls[0][0]).toMatchObject({
      take: 3,
      cursor: { id: 'z' },
      skip: 1,
    });
  });
});
