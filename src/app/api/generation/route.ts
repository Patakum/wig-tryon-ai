import { getOptionalViewer } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { getRequiredSearchParam } from '@/src/lib/api/parse';
import { getGenerationForViewer } from '@/src/services/generation';

export async function GET(req: Request) {
  try {
    const viewer = await getOptionalViewer();
    const id = getRequiredSearchParam(req, 'id', 'Missing generation id');
    const generation = await getGenerationForViewer(id, viewer);

    return ok({ status: generation.status });
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to fetch generation');
  }
}
