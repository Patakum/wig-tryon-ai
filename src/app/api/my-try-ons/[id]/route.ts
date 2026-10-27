import { getOptionalViewer } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { requireRouteParam } from '@/src/lib/api/parse';
import { deleteTryOn } from '@/src/services/try-on-deletion';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const viewer = await getOptionalViewer();
    const { id } = await context.params;

    await deleteTryOn(requireRouteParam(id, 'No id provided'), viewer);

    return ok({ deleted: true });
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to delete try-on');
  }
}
