import { getOptionalViewer } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { getRequiredSearchParam } from '@/src/lib/api/parse';
import { getGenerationStatus } from '@/src/services/generation';

export async function GET(req: Request) {
  try {
    const viewer = await getOptionalViewer();
    const id = getRequiredSearchParam(req, 'id', 'Missing generation id');
    return ok(await getGenerationStatus(id, viewer));
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to fetch generation');
  }
}
