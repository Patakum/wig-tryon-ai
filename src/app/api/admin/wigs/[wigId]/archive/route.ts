import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { archiveWigSchema, parseJsonBody } from '@/src/lib/api/parse';
import { setWigArchived } from '@/src/services/wig-photo';

type RouteContext = { params: Promise<{ wigId: string }> };

export async function POST(req: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { wigId } = await context.params;
    const { archived } = await parseJsonBody(req, archiveWigSchema);

    const wig = await setWigArchived(wigId, archived);

    revalidatePath('/');
    revalidatePath('/catalog');
    revalidatePath('/favorites');
    revalidatePath(`/wigs/${wigId}`);

    return ok({ wig });
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to update wig availability');
  }
}
