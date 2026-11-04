import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { parseImageFormFile } from '@/src/lib/api/parse';
import { addWigPhoto } from '@/src/services/wig-photo';

type RouteContext = { params: Promise<{ wigId: string }> };

export async function POST(req: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { wigId } = await context.params;
    const file = parseImageFormFile(await req.formData());

    const photo = await addWigPhoto(wigId, file);

    revalidatePath('/catalog');
    revalidatePath(`/wigs/${wigId}`);

    return ok({ photo }, 201);
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to add photo');
  }
}
