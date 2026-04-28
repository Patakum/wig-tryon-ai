import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';
import { requireAdmin } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { parseImageFormFile, parseWigFormData } from '@/src/lib/api/parse';
import { createWig, uploadWigReferenceImage } from '@/src/services/wig';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const file = parseImageFormFile(formData);
    const { name, description, price } = parseWigFormData(formData);

    const imageUrl = await uploadWigReferenceImage(file);

    const wig = await createWig({
      name,
      imageUrl,
      description: description ?? null,
      price,
    });

    revalidatePath('/catalog');

    return ok({ wig });
  } catch (error) {
    return normalizeErrorToResponse(error, 'Wig upload failed');
  }
}
