import { getOptionalUserId } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { generateRequestSchema, parseJsonBody } from '@/src/lib/api/parse';
import { createPendingGeneration, runGeneration } from '@/src/services/generation';

export async function POST(req: Request) {
  try {
    const userId = await getOptionalUserId();
    const { photoId, wigId } = await parseJsonBody(req, generateRequestSchema);

    const { generationId } = await createPendingGeneration({
      photoId,
      wigId,
      viewerUserId: userId,
    });

    // Fire-and-forget: start AI work in the background without blocking the response.
    // On Vercel, wrap with waitUntil() from @vercel/functions for serverless reliability.
    runGeneration(generationId).catch((err: unknown) =>
      console.error('[generate] runGeneration failed:', err),
    );

    return ok({ generationId }, 201);
  } catch (error: unknown) {
    return normalizeErrorToResponse(error, 'Generation failed');
  }
}
