import { getOptionalViewer, requireSessionUser } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { historyQuerySchema } from '@/src/lib/api/parse';
import { getHistoryForUser } from '@/src/services/history';
import { deleteAllTryOns } from '@/src/services/try-on-deletion';

export async function GET(req: Request) {
  try {
    const user = await requireSessionUser();
    const { cursor } = historyQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );

    return ok(await getHistoryForUser(user.id, { cursor }));
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to load history');
  }
}

// Deletes one batch of the customer's try-ons; repeat until remaining is 0.
export async function DELETE() {
  try {
    const viewer = await getOptionalViewer();

    return ok(await deleteAllTryOns(viewer));
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to delete try-ons');
  }
}
