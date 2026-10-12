export type ApiSuccess<T> = T;

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export function ok<T>(data: T, status = 200): Response {
  return Response.json(data satisfies ApiSuccess<T>, { status });
}

export function privateImageResponse(
  body: ReadableStream<Uint8Array>,
  contentType: string,
): Response {
  return new Response(body, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export function error(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } } satisfies ApiErrorBody, {
    status,
  });
}

export function badRequest(message: string, code = 'BAD_REQUEST'): Response {
  return error(400, code, message);
}

export function unauthorized(
  message = 'Unauthorized',
  code = 'UNAUTHORIZED',
): Response {
  return error(401, code, message);
}

export function forbidden(message = 'Forbidden', code = 'FORBIDDEN'): Response {
  return error(403, code, message);
}

export function notFound(message: string, code = 'NOT_FOUND'): Response {
  return error(404, code, message);
}

export function serverError(
  message = 'Internal server error',
  code = 'INTERNAL_ERROR',
): Response {
  return error(500, code, message);
}
