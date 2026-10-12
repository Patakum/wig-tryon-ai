import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/src/lib/prisma';

export const GUEST_SESSION_COOKIE = 'wig_guest_session';
export const GUEST_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function findGuestSession(token?: string): Promise<string | null> {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return null;
  }

  const guestSession = await prisma.guestSession.findFirst({
    where: {
      tokenHash: hashToken(token),
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  return guestSession?.id ?? null;
}

export async function createGuestSession(): Promise<{
  id: string;
  token: string;
}> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(
    Date.now() + GUEST_SESSION_MAX_AGE * 1000,
  );
  const guestSession = await prisma.guestSession.create({
    data: {
      tokenHash: hashToken(token),
      expiresAt,
    },
    select: { id: true },
  });

  return { id: guestSession.id, token };
}
