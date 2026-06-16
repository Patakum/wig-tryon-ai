import { getOptionalUserId } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { getRequiredSearchParam } from '@/src/lib/api/parse';
import { getGenerationForViewer } from '@/src/services/generation';

export async function GET(req: Request) {
  try {
    const userId = await getOptionalUserId();
    const id = getRequiredSearchParam(req, 'id', 'Missing generation id');
    const generation = await getGenerationForViewer(id, userId);

    return ok(generation);
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to fetch generation');
  }
}
