import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

type RouteContext = {
  params: Promise<{
    photoId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  let userId: string | null = null;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  const { photoId } = await context.params;

  if (!photoId) {
    return Response.json({ error: 'No photoId provided' }, { status: 400 });
  }

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    return Response.json({ error: 'Photo not found' }, { status: 404 });
  }

  if (photo.userId && photo.userId !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  return Response.json(photo);
}
