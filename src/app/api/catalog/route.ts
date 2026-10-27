import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { catalogQuerySchema, searchWigs } from '@/src/services/catalog';

export async function GET(req: Request) {
  try {
    const query = catalogQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );

    return ok(await searchWigs(query));
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to load catalog');
  }
}
