import { ZodError } from 'zod';
import { CloudinaryConfigError } from '@/src/lib/cloudinary';
import {
  badRequest,
  error as jsonError,
  serverError,
  type ApiErrorBody,
} from '@/src/lib/api/http';

export class ApiRouteError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiRouteError';
    this.status = status;
    this.code = code;
  }
}

export function throwApiError(
  status: number,
  code: string,
  message: string,
): never {
  throw new ApiRouteError(status, code, message);
}

export function normalizeErrorToResponse(
  err: unknown,
  fallbackMessage: string,
): Response {
  if (err instanceof ApiRouteError) {
    return jsonError(err.status, err.code, err.message);
  }

  if (err instanceof ZodError) {
    const first = err.issues[0];
    return badRequest(
      first?.message ?? 'Validation failed',
      'VALIDATION_ERROR',
    );
  }

  if (err instanceof CloudinaryConfigError) {
    return serverError(err.message, 'CLOUDINARY_MISCONFIGURED');
  }

  if (err instanceof SyntaxError) {
    return badRequest('Invalid JSON body', 'INVALID_JSON');
  }

  const message = err instanceof Error ? err.message : String(err);
  const lowered = message.toLowerCase();

  if (lowered.includes('insufficient_quota') || lowered.includes('billing')) {
    return jsonError(
      402,
      'BILLING_ERROR',
      'OpenAI billing error: insufficient quota. Add credits at https://platform.openai.com/account/billing and retry.',
    );
  }

  console.error(err);
  return serverError(fallbackMessage, 'INTERNAL_ERROR');
}

export function getErrorMessageFromBody(body: unknown): string {
  if (!body || typeof body !== 'object') {
    return 'Request failed';
  }

  const payload = body as ApiErrorBody;
  return payload.error?.message ?? 'Request failed';
}
