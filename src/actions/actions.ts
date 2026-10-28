'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/src/lib/api/auth';
import { parseImageFormFile, parseWigFormData } from '@/src/lib/api/parse';
import {
  createWig,
  updateWig,
  uploadWigReferenceImage,
} from '@/src/services/wig';
import type { WigActionState } from '@/src/actions/types';

// Success redirects to the admin list, so only a failure returns a state.
async function saveWig(
  formData: FormData,
  save: (formData: FormData) => Promise<void>,
): Promise<WigActionState> {
  try {
    await requireAdmin();
    await save(formData);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save wig';
    return { error: message, success: false };
  }

  revalidatePath('/', 'layout');
  redirect('/admin');
}

export async function uploadWigAction(
  _prev: WigActionState,
  formData: FormData,
): Promise<WigActionState> {
  return saveWig(formData, async (data) => {
    const imageUrl = await uploadWigReferenceImage(parseImageFormFile(data));
    await createWig({ ...parseWigFormData(data), imageUrl });
  });
}

export async function updateWigAction(
  wigId: string,
  _prev: WigActionState,
  formData: FormData,
): Promise<WigActionState> {
  return saveWig(formData, async (data) => {
    const fields = parseWigFormData(data);
    // The image is optional when editing: no new file keeps the current one.
    const file = data.get('file');
    const imageUrl =
      file instanceof File && file.size > 0
        ? await uploadWigReferenceImage(parseImageFormFile(data))
        : undefined;
    await updateWig(wigId, { ...fields, imageUrl });
  });
}
