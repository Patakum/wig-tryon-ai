import { requireAdmin } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { privateImageResponse } from '@/src/lib/api/http';
import { requireRouteParam } from '@/src/lib/api/parse';
import { getAdminImage } from '@/src/services/admin-review';

type RouteContext = { params: Promise<{ generationId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { generationId } = await context.params;
    const image = await getAdminImage(
      requireRouteParam(generationId, 'No generationId provided'),
      'result',
    );

    return privateImageResponse(image.body, image.contentType);
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to fetch image');
  }
}
