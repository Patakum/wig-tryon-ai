import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { generationId, message } = await req.json();

    if (!generationId || !message) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const generation = await prisma.generation.findUnique({
      where: { id: generationId },
      select: { userId: true },
    });

    if (!generation) {
      return Response.json({ error: 'Generation not found' }, { status: 404 });
    }

    if (generation.userId && generation.userId !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        generationId,
        userId: user.id,
        message,
      },
    });

    return Response.json(feedback);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
