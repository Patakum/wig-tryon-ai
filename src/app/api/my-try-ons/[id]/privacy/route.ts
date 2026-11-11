import { getOptionalViewer } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import {
  adminVisibilitySchema,
  parseJsonBody,
  requireRouteParam,
} from '@/src/lib/api/parse';
import { updateAdminVisibility } from '@/src/services/admin-review';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const viewer = await getOptionalViewer();
    const { id } = await context.params;
    const settings = await parseJsonBody(req, adminVisibilitySchema);

    const updated = await updateAdminVisibility(
      requireRouteParam(id, 'No id provided'),
      viewer,
      settings,
    );

    return ok(updated);
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to update privacy settings');
  }
}
