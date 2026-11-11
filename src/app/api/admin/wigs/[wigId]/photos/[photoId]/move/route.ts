import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { movePhotoSchema, parseJsonBody } from '@/src/lib/api/parse';
import { moveWigPhoto } from '@/src/services/wig-photo';

type RouteContext = { params: Promise<{ wigId: string; photoId: string }> };

export async function POST(req: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { wigId, photoId } = await context.params;
    const { direction } = await parseJsonBody(req, movePhotoSchema);

    await moveWigPhoto(wigId, photoId, direction);

    revalidatePath('/catalog');
    revalidatePath(`/wigs/${wigId}`);

    return ok({ moved: true });
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to reorder photo');
  }
}
