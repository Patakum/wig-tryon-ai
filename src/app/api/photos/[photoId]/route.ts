import { getOptionalUserId } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { requireRouteParam } from '@/src/lib/api/parse';
import { getPhotoForViewer } from '@/src/services/photo';

type RouteContext = {
  params: Promise<{
    photoId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await getOptionalUserId();
    const { photoId } = await context.params;
    const id = requireRouteParam(photoId, 'No photoId provided');

    const photo = await getPhotoForViewer(id, userId);
    return ok(photo);
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to fetch photo');
  }
}
