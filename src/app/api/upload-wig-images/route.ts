import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';
import { requireAdmin } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { createWigImage, uploadWigImage } from '@/src/services/wig-image';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const wigId = formData.get('wigId') as string;
    const files = formData.getAll('files') as File[];
    const angles = formData.getAll('angles') as string[];

    if (!wigId) {
      return new Response(JSON.stringify({ error: 'wigId required' }), { status: 400 });
    }

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files provided' }), { status: 400 });
    }

    const images = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!(file instanceof File) || !file.type.startsWith('image/')) {
        continue;
      }

      const imageUrl = await uploadWigImage(file);
      const angle = angles[i] || null;
      const image = await createWigImage({
        wigId,
        imageUrl,
        angle,
        order: i,
      });
      images.push(image);
    }

    revalidatePath(`/wigs/${wigId}`);
    revalidatePath(`/admin/wigs/${wigId}/images`);
    return ok({ images });
  } catch (error) {
    return normalizeErrorToResponse(error, 'Image upload failed');
  }
}
