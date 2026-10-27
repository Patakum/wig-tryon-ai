import { prisma } from '@/src/lib/prisma';

export async function GET() {
  const wigs = await prisma.wig.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json(wigs);
}