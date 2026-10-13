import { getOptionalViewer } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { privateImageResponse } from '@/src/lib/api/http';
import { requireRouteParam } from '@/src/lib/api/parse';
import { getPhotoImage } from '@/src/services/private-image';

type RouteContext = {
  params: Promise<{ photoId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const viewer = await getOptionalViewer();
    const { photoId } = await context.params;
    const image = await getPhotoImage(
      requireRouteParam(photoId, 'No photoId provided'),
      viewer,
    );

    return privateImageResponse(image.body, image.contentType);
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to fetch photo');
  }
}
