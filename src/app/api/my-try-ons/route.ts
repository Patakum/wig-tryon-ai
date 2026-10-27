import { requireSessionUser } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { historyQuerySchema } from '@/src/lib/api/parse';
import { getHistoryForUser } from '@/src/services/history';

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
