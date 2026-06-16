'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/src/lib/api/auth';
import { parseImageFormFile, parseWigFormData } from '@/src/lib/api/parse';
import { createWig, uploadWigReferenceImage } from '@/src/services/wig';
import type { WigActionState } from '@/src/actions/types';

export async function uploadWigAction(
  _prev: WigActionState,
  formData: FormData,
): Promise<WigActionState> {
  try {
    await requireAdmin();

    const file = parseImageFormFile(formData);
    const { name, description, price } = parseWigFormData(formData);

    const imageUrl = await uploadWigReferenceImage(file);
    await createWig({
      name,
      imageUrl,
      description: description ?? null,
      price,
    });

    revalidatePath('/catalog');

    return { error: null, success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create wig';
    return { error: message, success: false };
  }
}
