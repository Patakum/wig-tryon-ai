# Agent Rules – Wig Try-On AI

## Do
- Ask questions whenever something is unclear.
- Read the existing file before editing it — never guess its current content.
- Use `pnpm` as the package manager (not `npm` or `yarn`).
- Run  `pnpm run dev` to check the results and get errors
- Run `pnpm run build` or check `get_errors` after non-trivial changes to catch type errors early.

### Architecture
- All business logic goes in `src/services/` (`photo.ts`, `wig.ts`, `generation.ts`). API routes are thin orchestrators.
- All Cloudinary operations go through `src/lib/cloudinary.ts` or `src/lib/cloudinary-utils.ts`. Never call the Cloudinary SDK directly from components or routes.
- All Replicate calls go through `src/lib/replicate.ts`.
- Import Prisma only from `src/lib/prisma.ts` (singleton — prevents connection pool exhaustion in dev).
- Use `shadcn/ui` primitives (Button, Dialog, Card, Input) over custom UI.
- Use `zod` for input validation at API route and Server Action boundaries.

### API Routes
- Return responses using the shared helpers: `ok()`, `normalizeErrorToResponse()` from `src/lib/api/http.ts` and `errors.ts`.
- Parse form files with `parseImageFormFile(formData)` from `src/lib/api/parse.ts` — pass the already-parsed `FormData`, not the raw `Request` (body stream can only be read once).
- Validate admin access server-side with `requireAdmin()` from `src/lib/api/auth.ts` before any admin mutation.

### Auth & Privacy
- Never trust client-supplied user IDs. Always derive identity from the session server-side via `getServerSession(authOptions)`.
- Enforce ownership on `Photo` and `Generation` reads/writes — return `403` if `resource.userId` doesn't match the session user.
- Admin-only routes must check `session.user.role === "admin"` server-side. Client-side route guards alone are not sufficient.

### Database
- Schema source of truth is `prisma/schema.prisma`. Never edit the DB directly.
- Dev schema changes: `npx prisma db push`. Production: `npx prisma migrate deploy`.
- Create named migrations with `npx prisma migrate dev --name <name>` when changes should be tracked.

### Image Uploads
- `parseImageFormFile` validates that the uploaded field is a `File` with an `image/*` MIME type.
- Show a local blob URL preview immediately on file select — do not wait for a server round-trip.
- Only upload to Cloudinary when the user explicitly submits the form.
- Revoke blob URLs with `URL.revokeObjectURL()` after they are no longer needed.

## Don't
- Don't call `req.formData()` more than once in the same route handler — the body stream is consumed after the first call.
- Don't stream or log image URLs in client-visible errors — generation results are private.
- Don't import or call the Cloudinary or Replicate SDKs directly from components or pages.
- Don't use the Pages Router — this project uses Next.js App Router only.
- Don't bypass admin checks with client-side guards.
- Don't add docstrings, comments, or type annotations to code you didn't change.
- Don't add features or refactor code beyond what was explicitly requested.
- Don't run `npm install` or `yarn` — use `pnpm`.

