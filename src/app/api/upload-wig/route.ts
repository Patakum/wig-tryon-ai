import { NextRequest } from 'next/server';
import { requireAdmin } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import { parseJsonBody, uploadBase64Schema } from '@/src/lib/api/parse';
import { uploadWigReferenceImage } from '@/src/services/wig';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { file } = await parseJsonBody(req, uploadBase64Schema);
    const imageUrl = await uploadWigReferenceImage(file);

    return ok({ imageUrl });
  } catch (error) {
    return normalizeErrorToResponse(error, 'Wig upload failed');
  }
}
