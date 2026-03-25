import { prisma } from '@/src/lib/prisma';

export async function POST(req: Request) {
  try {
    const { generationId, userId, message } = await req.json();

    if (!generationId || !userId || !message) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        generationId,
        userId,
        message,
      },
    });

    return Response.json(feedback);
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
