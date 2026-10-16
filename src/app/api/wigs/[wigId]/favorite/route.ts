import { getOptionalUser, requireSessionUser } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { requireRouteParam } from '@/src/lib/api/parse';
import { getFavoriteState, toggleFavorite } from '@/src/services/wig';

type RouteContext = {
  params: Promise<{
    wigId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const [user, { wigId }] = await Promise.all([
      getOptionalUser(),
      context.params,
    ]);
    const id = requireRouteParam(wigId, 'No wigId provided');
    const favorite = await getFavoriteState({
      wigId: id,
      userId: user?.id ?? null,
    });

    return ok(favorite);
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to fetch favorite state');
  }
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const [user, { wigId }] = await Promise.all([
      requireSessionUser(),
      context.params,
    ]);
    const id = requireRouteParam(wigId, 'No wigId provided');
    const favorite = await toggleFavorite({
      wigId: id,
      userId: user.id,
    });

    return ok(favorite);
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to update favorite state');
  }
}
