import { NextRequest } from 'next/server';
import { getOptionalUserId } from '@/src/lib/api/auth';
import { normalizeErrorToResponse } from '@/src/lib/api/errors';
import { ok } from '@/src/lib/api/http';
import {
  parseImageFormFile,
  parseJsonBody,
  uploadBase64Schema,
} from '@/src/lib/api/parse';
import {
  uploadPhotoFromDataUri,
  uploadPhotoFromFile,
} from '@/src/services/photo';

export async function POST(req: NextRequest) {
  try {
    const userId = await getOptionalUserId();

    const contentType = req.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = parseImageFormFile(formData);
      const uploaded = await uploadPhotoFromFile(file, userId);
      return ok(uploaded, 201);
    }

    const { file } = await parseJsonBody(req, uploadBase64Schema);
    const uploaded = await uploadPhotoFromDataUri(file, userId);
    return ok(uploaded, 201);
  } catch (error) {
    return normalizeErrorToResponse(error, 'Upload failed');
  }
}
