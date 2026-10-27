import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { removeWigPhoto } from '@/src/services/wig-photo';

type RouteContext = { params: Promise<{ wigId: string; photoId: string }> };

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { wigId, photoId } = await context.params;

    await removeWigPhoto(wigId, photoId);

    revalidatePath('/catalog');
    revalidatePath(`/wigs/${wigId}`);

    return ok({ deleted: true });
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to remove photo');
  }
}
