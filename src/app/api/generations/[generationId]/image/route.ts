import { getOptionalViewer } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { notFound } from '@/src/lib/api/http';
import { privateImageResponse } from '@/src/lib/api/http';
import { requireRouteParam } from '@/src/lib/api/parse';
import { getGenerationImage } from '@/src/services/private-image';

type RouteContext = {
  params: Promise<{ generationId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const viewer = await getOptionalViewer();
    const { generationId } = await context.params;
    const image = await getGenerationImage(
      requireRouteParam(generationId, 'No generationId provided'),
      viewer,
    );

    if (!image) {
      return notFound('Generation image not available');
    }

    return privateImageResponse(image.body, image.contentType);
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to fetch generation image');
  }
}
