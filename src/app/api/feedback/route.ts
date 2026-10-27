import { getOptionalViewer, requireSessionUser } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { feedbackSchema, parseJsonBody } from '@/src/lib/api/parse';
import { createFeedbackForGeneration } from '@/src/services/generation';

export async function POST(req: Request) {
  try {
    await requireSessionUser();
    const viewer = await getOptionalViewer();
    const { generationId, message } = await parseJsonBody(req, feedbackSchema);

    const feedback = await createFeedbackForGeneration({
      generationId,
      viewer,
      message,
    });

    return ok(feedback, 201);
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to save feedback');
  }
}
