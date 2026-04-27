import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { throwApiError } from '@/src/lib/api/errors';

export type SessionUser = {
  id: string;
  email: string;
  role: string;
};

async function resolveUserByEmail(email: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (!user?.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

export async function getOptionalUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const user = await resolveUserByEmail(session.user.email);
  return user?.id ?? null;
}

export async function requireSessionUser(): Promise<SessionUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throwApiError(401, 'UNAUTHORIZED', 'Unauthorized');
  }

  const user = await resolveUserByEmail(session.user.email);

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
