import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/src/lib/prisma';

export const CATALOG_PAGE_SIZE = 12;

export const CATALOG_SORTS = ['newest', 'price_asc', 'price_desc'] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

const optionalPrice = z.preprocess(
  (value) => (value === '' || value == null ? undefined : value),
  z.coerce.number().min(0).max(1_000_000).optional(),
);

export const catalogQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    min: optionalPrice,
    max: optionalPrice,
    sort: z.enum(CATALOG_SORTS).default('newest'),
    cursor: z.string().min(1).optional(),
  })
  .refine(
    (value) =>
      value.min === undefined ||
      value.max === undefined ||
      value.min <= value.max,
    { message: 'Minimum price cannot exceed maximum price', path: ['min'] },
  );

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;

export type CatalogItem = {
  id: string;
  name: string;
  imageUrl: string;
  price: number | null;
};

export type CatalogPage = {
  items: CatalogItem[];
  nextCursor: string | null;
};

// Page URLs come from users, so an invalid value falls back to defaults
// instead of failing the whole page.
export function parseCatalogSearchParams(
  params: Record<string, string | string[] | undefined>,
): CatalogQuery {
  const flat = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  );
  const parsed = catalogQuerySchema.safeParse(flat);

  return parsed.success ? parsed.data : catalogQuerySchema.parse({});
}

function orderByFor(sort: CatalogSort): Prisma.WigOrderByWithRelationInput[] {
  switch (sort) {
    case 'price_asc':
      return [{ price: { sort: 'asc', nulls: 'last' } }, { id: 'asc' }];
    case 'price_desc':
      return [{ price: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }];
    default:
      return [{ createdAt: 'desc' }, { id: 'desc' }];
  }
}

// Escape LIKE wildcards so user input is matched literally.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export async function searchWigs(
  query: CatalogQuery,
  limit = CATALOG_PAGE_SIZE,
): Promise<CatalogPage> {
  const text = query.q ? escapeLike(query.q) : '';
  const hasPriceFilter = query.min !== undefined || query.max !== undefined;

  const rows = await prisma.wig.findMany({
    where: {
      archivedAt: null,
      ...(text
        ? {
            OR: [
              { name: { contains: text, mode: 'insensitive' } },
              { description: { contains: text, mode: 'insensitive' } },
            ],
          }
        : {}),
      // A price filter excludes wigs without a price.
      ...(hasPriceFilter
        ? { price: { gte: query.min, lte: query.max } }
        : {}),
    },
    orderBy: orderByFor(query.sort),
    take: limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    select: { id: true, name: true, imageUrl: true, price: true },
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}
