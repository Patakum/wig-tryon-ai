import { prisma } from '@/src/lib/prisma';

type RouteContext = {
  params: Promise<{
    wigId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { wigId } = await context.params;

  if (!wigId) {
    return Response.json({ error: 'No wigId provided' }, { status: 400 });
  }

  const wig = await prisma.wig.findUnique({
    where: { id: wigId },
  });

  if (!wig) {
    return Response.json({ error: 'Wig not found' }, { status: 404 });
  }

  return Response.json(wig);
}
