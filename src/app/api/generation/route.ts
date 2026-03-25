import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  let userId: string | null = null;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return Response.json({ error: 'Missing generation id' }, { status: 400 });
  }

  const generation = await prisma.generation.findUnique({
    where: { id },
  });

  if (!generation) {
    return Response.json({ error: 'Generation not found' }, { status: 404 });
  }

  if (generation.userId && generation.userId !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  return Response.json(generation);
}
