import { prisma } from '@/src/lib/prisma';

type RouteContext = {
  params: Promise<{
    photoId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
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

  return Response.json(photo);
}
