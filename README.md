# AI Wig Try-On

**Try on a wig virtually before choosing it.** A mobile-first Hebrew (RTL) web app that lets visitors browse a wig catalog, upload a selfie, and preview an AI-generated result alongside the original image.

**Built by Meir Hersonski** · Next.js 16 · React 19 · TypeScript · OpenAI Image API · Prisma/PostgreSQL

[**Live demo (Vercel)**](https://wig-tryon-ai.vercel.app/) · [Architecture](#architecture) · [Run locally](#run-locally)

> **Prototype / work in progress.** The live URL points to an existing deployment; its parity with the current `main` branch and end-to-end generation have **not** been verified. The generation output is illustrative, not an exact representation of wig fit, color, or a guaranteed face-preserving edit.

## The product in 30 seconds

Buying a wig from catalog photos makes it difficult to imagine the look on your own face. AI Wig Try-On connects **product discovery** to **personalized visual preview**, without requiring a visitor to register for their first try-on.

- **Shopper:** Browse wigs, view a specific wig, review photo instructions, upload/capture a selfie, and request a generated preview. Compare before/after images, leave feedback (signed-in users), or contact the business on WhatsApp.
- **Guest access:** A browser-bound guest session permits **one generation** before sign-in is required for another. Guest ownership is tracked separately from registered users.
- **Admin:** Server-protected access to add wigs and review feedback.
- **Language & UX:** Hebrew-first, RTL, and mobile-first.

### Screenshots

<p align="center">
  <img src="./docs/screenshots/home.webp" alt="Mobile homepage with the try-on call to action" width="260" />
  <img src="./docs/screenshots/catalog.webp" alt="Hebrew RTL mobile wig catalog and product grid" width="260" />
</p>

<p align="center"><sub>Mobile homepage and wig catalog · real application screenshots</sub></p>

**Example AI try-on: original selfie vs. generated preview**

![A supplied original selfie next to its AI-generated wig try-on preview](./docs/screenshots/before-after.webp)

*Illustrative before/after provided for this project. AI may alter facial details or the exact wig appearance; results are not guaranteed and this example is not a measured quality benchmark. Use demo images with appropriate permission only.*

## User flow

```text
Home / Catalog
    → Wig details
    → Photo instructions
    → Upload or capture selfie
    → Preview selfie + selected wig
    → Request AI try-on
    → Generation status / result
    → Before–after slider
    → Feedback (sign-in required) / WhatsApp
```

**Admin flow:** Sign in as admin → add a wig to the catalog → review submitted feedback.

## Architecture

```text
Browser (React 19, Hebrew RTL)
    │
    ▼
Next.js 16 App Router (pages + Route Handlers)
    ├── Better Auth → sessions / Google OAuth (optional) / admin roles
    ├── Upload & photo service → Cloudinary image storage
    ├── Catalog & wig service → Prisma → PostgreSQL
    ├── Generation service
    │     ├── Sharp → normalize selfie and prepare an edit mask
    │     ├── Replicate segmentation (optional) → hair mask
    │     │            └── geometric mask fallback
    │     ├── OpenAI Image API → image edit
    │     └── Cloudinary → generated image
    └── Feedback + ownership-checked image routes → Prisma/PostgreSQL
```

- **App & UI:** `src/app/` contains App Router routes and server APIs; `src/components/` contains reusable UI and upload components.
- **Business logic:** `src/services/` separates wig lookup, photo handling, authorization/ownership, and generation.
- **Persistence:** `prisma/schema.prisma` models users, sessions, guest sessions, wigs, photos, generations, and feedback. Generation state is persisted as `pending`, `completed`, or `failed`.
- **Privacy controls:** Server-side ownership checks protect photo and generation retrieval. The browser holds a guest-session cookie; the server stores a hashed guest token. The application serves private images through access-checked API routes, not directly to the browser from persisted storage URLs.
- **Authentication:** Better Auth handles email/password and optional Google OAuth; server-side authorization restricts admin features.

## How AI integration works

The generation pipeline is implemented in [`src/services/generation.ts`](./src/services/generation.ts):

1. Look up the authorized selfie and chosen wig in PostgreSQL.
2. Fetch the two images, then normalize the selfie to **1024 × 1024** with **Sharp**.
3. If configured, call **Replicate** for a hair-segmentation mask; on failure or when disabled, use a proportional **geometric mask**.
4. Send the normalized selfie, reference wig image, edit mask, and a face-preservation prompt to **OpenAI `images.edit`** using `gpt-image-2`.
5. Upload the returned image to **Cloudinary**, save its reference in PostgreSQL, and update the generation state. The UI polls for status and displays a before/after slider.

This is an **API integration**, not a custom-trained image model. The mask and prompt are attempts to constrain edits; they do **not** guarantee facial identity preservation.

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, RTL layout |
| UI & forms | Radix UI, shadcn-style components, React Dropzone, React Webcam, React Compare Slider |
| Backend | Next.js Route Handlers, Zod request validation |
| Authentication | Better Auth, sessions, optional Google OAuth, admin roles |
| Data | PostgreSQL, Prisma |
| AI & image processing | OpenAI Image API (`gpt-image-2`), Sharp, optional Replicate |
| Image storage | Cloudinary |
| Testing & CI | Vitest, ESLint, TypeScript checks, GitHub Actions |
| Deployment | Vercel URL provided above; current-branch release verification pending |

## Testing & verification

The repository includes **Vitest** service and utility tests covering mocked generation behavior, uploads, ownership/guest sessions, and redirect validation. Prisma and external image providers are mocked for unit tests: **passing tests is not evidence of realistic or accurate generated hair**.

GitHub Actions configuration in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs lint, type checks, tests, PostgreSQL schema synchronization against a disposable CI database, and a production build on pushes and pull requests. Workflow configuration exists; this README does not claim a particular hosted run passed.

```bash
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
```

A prior [baseline review](./docs/BASELINE_STATUS.md) reported local lint/typecheck/test passes but a **build memory failure** during page-data collection on that machine. Those historical results are not a fresh run on the current commit.

For real-model validation, see the [consent-first generation quality scorecard](./docs/GENERATION_QUALITY_EVALUATION.md). No completed, approved quality study is documented.

## Known limitations / engineering trade-offs

- **Identity preservation is imperfect.** Generative edits can change facial features, hairline, lighting, or the wig's shape and shade. A segmentation-based mask is optional and the geometric fallback relies on rough portrait proportions.
- **No verified quality benchmark or production pilot.** A real-image evaluation needs participant consent, a request/spend cap, and defined acceptance thresholds.
- **Generation reliability:** The API currently starts work in-process after returning a pending ID. There is no durable background queue, guaranteed retry, or fully atomic usage quota; serverless execution may interrupt jobs.
- **Guest-to-account and account history:** Some guest ownership handling exists, but complete transfer, saved try-on history, and favorites are not fully delivered.
- **Catalog & validation:** Catalog search/filters, full product galleries, and comprehensive selfie-quality/device validation are incomplete.
- **Deployment & operations:** The live deployment has not been established as equivalent to the current repository state. Do not interpret the demo link as evidence of production readiness.
- **Data handling:** A complete, reviewed consent/retention/deletion policy remains to be implemented before processing customer images at scale.

See [baseline/roadmap](./docs/BASELINE_STATUS.md) for a fuller implementation checklist. Some branch-specific notes in that document are historical; verify against the current `main` commit.

## Run locally

**Prerequisites:** Node.js **20.9+**, `pnpm`, a **disposable PostgreSQL development database**, and credentials for any providers you intend to exercise.

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
```

Fill in `.env` locally (never commit credentials):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Development PostgreSQL connection |
| `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` | Server-side auth secret and app origin |
| `NEXT_PUBLIC_APP_URL` | Client-facing app URL, normally `http://localhost:3000` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Image upload/storage |
| `OPENAI_API_KEY` | AI try-on generation |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google sign-in |
| `REPLICATE_API_TOKEN` / `REPLICATE_HAIR_SEGMENTATION_MODEL` | Optional hair segmentation |
| `WHATSAPP_PHONE` | Optional business contact |

The full set of available keys is in [`.env.example`](./.env.example).

For a **fresh, disposable** local database only, review the schema and sync it, then start the app:

```bash
pnpm exec prisma db push
pnpm run dev
```

Open **http://localhost:3000** (or the port reported by Next.js). For PowerShell, use `Copy-Item .env.example .env` instead of `cp`. Never run `prisma db push` against production; the auth/schema changes require a reviewed migration plan.

---

**Project by [Meir Hersonski](https://github.com/Patakum)** · [Live demo](https://wig-tryon-ai.vercel.app/)
