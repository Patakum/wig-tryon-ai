import { timingSafeEqual } from 'node:crypto';
import { normalizeErrorToResponse, throwApiError } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { runRetentionCleanup } from '@/src/services/retention';

export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;

  // Without a secret the job stays closed instead of open to everyone.
  if (!secret) {
    throwApiError(500, 'CRON_MISCONFIGURED', 'CRON_SECRET is not configured');
  }

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(req.headers.get('authorization') ?? '');

  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

// Vercel Cron calls this daily (see vercel.json) with the CRON_SECRET bearer
// token. The response carries counts only, never image links or customer data.
export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) {
      throwApiError(401, 'UNAUTHORIZED', 'Unauthorized');
    }

    return ok(await runRetentionCleanup());
  } catch (error) {
    return normalizeErrorToResponse(error, 'Cleanup failed');
  }
}
