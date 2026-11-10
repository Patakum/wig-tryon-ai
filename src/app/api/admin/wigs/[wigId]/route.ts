import { requireAdmin } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { parseJsonBody, wigUpdateSchema } from '@/src/lib/api/parse';
import { revalidatePath } from 'next/cache';
import { updateWigDetails } from '@/src/services/wig-photo';

type RouteContext = { params: Promise<{ wigId: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { wigId } = await context.params;
    const data = await parseJsonBody(req, wigUpdateSchema);

    const wig = await updateWigDetails(wigId, data);

    revalidatePath('/catalog');
    revalidatePath(`/wigs/${wigId}`);

    return ok({ wig });
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to update wig');
  }
}
