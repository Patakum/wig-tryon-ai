import { z } from 'zod';
import { throwApiError } from '@/src/lib/api/errors';

export const uploadBase64Schema = z.object({
  file: z
    .string()
    .min(1, 'No file provided')
    .refine((value) => value.startsWith('data:image'), {
      message: 'Invalid file: must be a data:image string',
    }),
});

export const generateRequestSchema = z.object({
  photoId: z.string().min(1, 'photoId is required'),
  wigId: z.string().min(1, 'wigId is required'),
});

export const feedbackSchema = z.object({
  generationId: z.string().min(1, 'generationId is required'),
  message: z.string().trim().min(1, 'message is required'),
});

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  req: Request,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  const json = await req.json();
  return schema.parse(json);
}

export function getRequiredSearchParam(
  req: Request,
  key: string,
  message: string,
): string {
  const { searchParams } = new URL(req.url);
  const value = searchParams.get(key);

  if (!value) {
    throwApiError(400, 'BAD_REQUEST', message);
  }

  return value;
}

export function requireRouteParam(
  value: string | undefined,
  message: string,
): string {
  if (!value) {
    throwApiError(400, 'BAD_REQUEST', message);
  }

  return value;
}

export async function parseImageFormFile(req: Request): Promise<File> {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    throwApiError(400, 'BAD_REQUEST', 'No file provided');
  }

  if (!file.type.startsWith('image/')) {
    throwApiError(400, 'BAD_REQUEST', 'Invalid file');
  }

  return file;
}
