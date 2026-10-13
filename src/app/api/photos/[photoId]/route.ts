import { getOptionalViewer } from '@/src/lib/api/auth';
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
    const viewer = await getOptionalViewer();
    const { photoId } = await context.params;
    const id = requireRouteParam(photoId, 'No photoId provided');

    const photo = await getPhotoForViewer(id, viewer);
    return ok({
      photoId: photo.id,
      imageUrl: `/api/photos/${encodeURIComponent(photo.id)}/image`,
      createdAt: photo.createdAt,
    });
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to fetch photo');
  }
}
