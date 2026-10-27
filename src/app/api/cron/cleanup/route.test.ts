import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ runRetentionCleanup: vi.fn() }));

vi.mock('@/src/services/retention', () => ({
  runRetentionCleanup: mocks.runRetentionCleanup,
}));

import { GET } from '@/src/app/api/cron/cleanup/route';

const call = (authorization?: string) =>
  GET(
    new Request('https://example.test/api/cron/cleanup', {
      headers: authorization ? { authorization } : {},
    }),
  );

describe('GET /api/cron/cleanup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.runRetentionCleanup.mockResolvedValue({
      generationsDeleted: 1,
      photosDeleted: 2,
      guestSessionsDeleted: 3,
      failures: 0,
    });
    vi.stubEnv('CRON_SECRET', 's3cret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('runs the cleanup for the correct bearer secret and returns counts only', async () => {
    const res = await call('Bearer s3cret');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      generationsDeleted: 1,
      photosDeleted: 2,
      guestSessionsDeleted: 3,
      failures: 0,
    });
  });

  it('rejects missing and wrong secrets without running anything', async () => {
    expect((await call()).status).toBe(401);
    expect((await call('Bearer wrong!')).status).toBe(401);
    expect((await call('s3cret')).status).toBe(401);
    expect(mocks.runRetentionCleanup).not.toHaveBeenCalled();
  });

  it('stays closed when no secret is configured', async () => {
    vi.stubEnv('CRON_SECRET', '');

    const res = await call('Bearer ');

    expect(res.status).toBe(500);
    expect(mocks.runRetentionCleanup).not.toHaveBeenCalled();
  });
});
