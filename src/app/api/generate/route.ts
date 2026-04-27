import { getOptionalUserId } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { generateRequestSchema, parseJsonBody } from '@/src/lib/api/parse';
import { generateTryOn } from '@/src/services/generation';

export async function POST(req: Request) {
  try {
    const userId = await getOptionalUserId();
    const { photoId, wigId } = await parseJsonBody(req, generateRequestSchema);
    const result = await generateTryOn({
      photoId,
      wigId,
      viewerUserId: userId,
    });

    return ok(result, 201);
  } catch (error: unknown) {
    return normalizeErrorToResponse(error, 'Generation failed');
  }
}
