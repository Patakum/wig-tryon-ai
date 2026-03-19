import { prisma } from '@/src/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  const generation = await prisma.generation.findUnique({
    where: { id: id! },
  });

  return Response.json(generation);
}