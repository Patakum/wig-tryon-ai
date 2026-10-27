import { requireSessionUser } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { favoriteSchema, parseJsonBody } from '@/src/lib/api/parse';
import { addFavorite, removeFavorite } from '@/src/services/favorite';

export async function POST(req: Request) {
  try {
    const user = await requireSessionUser();
    const { wigId } = await parseJsonBody(req, favoriteSchema);

    await addFavorite(user.id, wigId);

    return ok({ wigId, favorited: true }, 201);
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to save favorite');
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireSessionUser();
    const { wigId } = await parseJsonBody(req, favoriteSchema);

    await removeFavorite(user.id, wigId);

    return ok({ wigId, favorited: false });
  } catch (error) {
    return normalizeErrorToResponse(error, 'Failed to remove favorite');
  }
}
