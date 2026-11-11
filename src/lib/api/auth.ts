import { cookies } from 'next/headers';
import { getSession } from '@/src/lib/auth';
import { isFakeProviders } from '@/src/lib/fake-providers';
import { prisma } from '@/src/lib/prisma';
import { throwApiError } from '@/src/lib/api/errors';
import { transferGuestOwnershipToUser } from '@/src/services/photo';
import {
  createGuestSession,
  findGuestSession,
  GUEST_SESSION_COOKIE,
  GUEST_SESSION_MAX_AGE,
} from '@/src/services/guest-session';
import type { ViewerIdentity } from '@/src/types/viewer';

export type SessionUser = {
  id: string;
  email: string;
  role: string;
};

async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      banned: true,
      deletedAt: true,
    },
  });

  if (!user || user.banned || user.deletedAt || !user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

async function getGuestSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return findGuestSession(cookieStore.get(GUEST_SESSION_COOKIE)?.value);
}

export async function getOptionalUser(): Promise<SessionUser | null> {
  return getCurrentUser();
}

export async function getOptionalViewer(): Promise<ViewerIdentity> {
  const [user, guestSessionId] = await Promise.all([
    getCurrentUser(),
    getGuestSessionId(),
  ]);

  if (user?.id && guestSessionId) {
    await transferGuestOwnershipToUser({
      userId: user.id,
      guestSessionId,
    });
  }

  return {
    userId: user?.id ?? null,
    guestSessionId,
  };
}

export async function getUploadViewer(): Promise<ViewerIdentity> {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestSessionId = await findGuestSession(
    cookieStore.get(GUEST_SESSION_COOKIE)?.value,
  );

  if (user) {
    if (guestSessionId) {
      await transferGuestOwnershipToUser({
        userId: user.id,
        guestSessionId,
      });
    }

    return { userId: user.id, guestSessionId };
  }

  if (guestSessionId) {
    return { userId: null, guestSessionId };
  }

  const guestSession = await createGuestSession();
  cookieStore.set(GUEST_SESSION_COOKIE, guestSession.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && !isFakeProviders(),
    sameSite: 'lax',
    path: '/',
    maxAge: GUEST_SESSION_MAX_AGE,
  });

  return { userId: null, guestSessionId: guestSession.id };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    throwApiError(401, 'UNAUTHORIZED', 'Unauthorized');
  }

  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireSessionUser();

  if (user.role !== 'admin') {
    throwApiError(403, 'FORBIDDEN', 'Unauthorized: admin access required');
  }

  return user;
}
