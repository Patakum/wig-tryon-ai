import { after } from 'next/server';
import { getOptionalViewer } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { generateRequestSchema, parseJsonBody } from '@/src/lib/api/parse';
import {
  createPendingGeneration,
  getGenerationCreationAccess,
  runGeneration,
} from '@/src/services/generation';

export const maxDuration = 300;

export async function GET() {
  try {
    const viewer = await getOptionalViewer();
    const access = await getGenerationCreationAccess(viewer);

    return ok(access);
  } catch (error: unknown) {
    return normalizeErrorToResponse(error, 'Failed to check generation access');
  }
}

export async function POST(req: Request) {
  try {
    const viewer = await getOptionalViewer();
    const { photoId, wigId } = await parseJsonBody(req, generateRequestSchema);

    const { generationId } = await createPendingGeneration({
      photoId,
      wigId,
      viewer,
    });

    // Run the AI work after the response is sent; after() keeps the
    // serverless invocation alive until it finishes (bounded by maxDuration).
    after(async () => {
      try {
        await runGeneration(generationId);
      } catch (err: unknown) {
        console.error('[generate] runGeneration failed:', err);
      }
    });

    return ok({ generationId }, 201);
  } catch (error: unknown) {
    return normalizeErrorToResponse(error, 'Generation failed');
  }
}
