import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  guestSession: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
}));

vi.mock('@/src/lib/prisma', () => ({
  prisma: { guestSession: mocks.guestSession },
}));

import { createGuestSession, findGuestSession } from './guest-session';

describe('guest sessions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('stores only a hash of a random browser token', async () => {
    mocks.guestSession.create.mockResolvedValue({ id: 'guest-a' });

    const session = await createGuestSession();

    expect(session.id).toBe('guest-a');
    expect(session.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(mocks.guestSession.create).toHaveBeenCalledWith({
      data: {
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expiresAt: expect.any(Date),
      },
      select: { id: true },
    });
    expect(
      mocks.guestSession.create.mock.calls[0][0].data.tokenHash,
    ).not.toBe(session.token);
  });

  it('resolves only unexpired, well-formed browser tokens', async () => {
    mocks.guestSession.findFirst.mockResolvedValue({ id: 'guest-a' });

    await expect(findGuestSession('a'.repeat(43))).resolves.toBe('guest-a');
    expect(mocks.guestSession.findFirst).toHaveBeenCalledWith({
      where: {
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expiresAt: { gt: expect.any(Date) },
      },
      select: { id: true },
    });

    await expect(findGuestSession('invalid-token')).resolves.toBeNull();
    expect(mocks.guestSession.findFirst).toHaveBeenCalledTimes(1);
  });

  it('returns no session for an expired or unknown token', async () => {
    mocks.guestSession.findFirst.mockResolvedValue(null);

    await expect(findGuestSession('b'.repeat(43))).resolves.toBeNull();
  });
});
