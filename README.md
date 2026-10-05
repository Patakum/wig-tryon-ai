# Wig Try-On AI

A mobile-first Hebrew/RTL wig catalog and AI try-on app built with Next.js, Better Auth, Prisma/PostgreSQL, Cloudinary, and OpenAI image generation.

## Local development

Requirements: Node.js 20.9 or newer and pnpm. From the repository root:

```powershell
corepack enable
pnpm install --frozen-lockfile
Copy-Item .env.example .env
pnpm run dev
```

Open <http://localhost:3000>. The `.env.example` file lists the variable names; put credentials only in the ignored local `.env` file or your deployment provider's secret settings. Never commit `.env`.

`DATABASE_URL` must point to a PostgreSQL development database. For a fresh, disposable database only, review the current schema and then synchronize it with:

```powershell
pnpm exec prisma db push
```

Do not point schema-sync commands at production. The Better Auth branch changes the auth tables and `User.emailVerified` type compared with the earlier NextAuth schema; production schema migration needs a reviewed migration plan.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string for Prisma |
| `BETTER_AUTH_SECRET` | Yes for auth | Unique Better Auth signing/encryption secret; keep it server-side |
| `BETTER_AUTH_URL` | Yes for auth | Canonical app origin, e.g. local `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Recommended | Better Auth client base URL; defaults to localhost in the client |
| `GOOGLE_CLIENT_ID` | For Google sign-in | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For Google sign-in | Google OAuth client secret |
| `CLOUDINARY_CLOUD_NAME` | Yes for uploads | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Yes for uploads | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes for uploads | Cloudinary API secret |
| `OPENAI_API_KEY` | Yes for try-on | OpenAI image generation |
| `REPLICATE_API_TOKEN` | Conditional | Required only when AI hair segmentation is enabled |
| `REPLICATE_HAIR_SEGMENTATION_MODEL` | Optional | Full `owner/model:version` identifier; enables Replicate segmentation |
| `WHATSAPP_PHONE` | Optional | Business WhatsApp number used by result contact links |
| `NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS` | Optional | Comma-separated extra remote image hostnames |

The values in `.env.example` are intentionally blank or local-only placeholders. Create real credentials in the relevant provider consoles; do not add them to source control.

## Main scripts and checks

```powershell
pnpm run dev
pnpm run build
pnpm run typecheck
pnpm run lint
pnpm test
```

The test suite uses mocked Prisma and image providers, so unit tests do not need database credentials and cannot make billable provider calls. CI provisions an isolated PostgreSQL test database for future integration tests; do not point tests at production data. Copy `.env.test.example` to `.env.test` only when configuring local integration tests, and use a disposable test database. The production build uses Webpack because the checked-in Turbopack build panics on this Windows checkout's non-ASCII path. See [docs/BASELINE_STATUS.md](./docs/BASELINE_STATUS.md) for baseline results and [docs/GENERATION_QUALITY_EVALUATION.md](./docs/GENERATION_QUALITY_EVALUATION.md) for the manual, consented real-provider quality review.

## Architecture

- App Router pages and API handlers live under `src/app/`.
- Business logic is in `src/services/` (`photo.ts`, `wig.ts`, `generation.ts`).
- Better Auth is configured in `src/lib/auth.ts`; the API handler is `src/app/api/auth/[...all]/route.ts`.
- Prisma uses the schema in `prisma/schema.prisma` and the singleton in `src/lib/prisma.ts`.
- Cloudinary integration is centralized in `src/lib/cloudinary.ts` and `src/lib/cloudinary-utils.ts`.
- Image generation uses OpenAI; optional hair segmentation uses Replicate via `src/lib/replicate.ts`.

## Current baseline

The current working branch is `better-auth`. See [docs/BASELINE_STATUS.md](./docs/BASELINE_STATUS.md) for branch and deployment evidence, local build/type/lint results, feature-by-feature roadmap status, and remaining launch gaps. The production roadmap source document is `Wig_Try_On_Production_Roadmap.docx`.
