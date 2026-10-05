# Baseline and roadmap status

Reviewed 2026-10-05 against `Wig_Try_On_Production_Roadmap.docx` on `better-auth`.

## Branch and deployment

- The earlier checkout was clean on `dev` at `d5d73d0`. GitHub has a separate `better-auth` branch; it was fetched and checked out locally at `604e144` (`origin/better-auth`).
- `better-auth` is not the repository default branch; GitHub reports `main` as the default. PR #9 from `dev` to `main` is open.
- The local `better-auth` app starts. Requests to `/`, `/login`, and `/signup` returned HTTP 200 after installing the branch's frozen dependencies.
- GitHub reports completed Vercel deployments for the older `dev` commit `d5d73d0` (May 27, 2026). No deployment/status evidence was found for `better-auth` at `604e144`; do not treat the older preview as a deployment of this branch or as proof of the current production state.
- The worktree also contains an untracked `Wig_Try_On_Production_Roadmap.docx`. It is the roadmap source and was left unchanged.

## Local verification

Commands were run on `better-auth` with the repository's locked dependencies. Secret values were not inspected or copied into this report.

| Check | Result |
| --- | --- |
| `pnpm run dev` | Starts at `http://localhost:3000`; `/`, `/login`, and `/signup` returned HTTP 200. `next.config.ts` now pins tracing and Turbopack roots to the repository to avoid selecting the unrelated parent `package-lock.json`. |
| `pnpm run build` | Passes with Webpack. The default Turbopack build panicked on the Cyrillic characters in this Windows project path (`Рабочий стол`), so the build script now explicitly uses Webpack. Remaining warnings: unresolved `encoding` and Node `fs` in the existing `face-api.js` dependency trace. |
| `pnpm run typecheck` | Passes. The script checks application and test TypeScript. |
| `pnpm run lint` | Passes. The initial lint run exposed 2 errors and 4 warnings; the form state update, compare-slider hydration check, and unused imports were corrected. |
| `pnpm test` | Passes: 9 unit tests. Tests cover photo/generation ownership and pending-job creation. Prisma, OpenAI, Replicate, and Cloudinary generation are mocked; provider mocks are asserted not called. |
| CI | Added `.github/workflows/ci.yml` for pull requests and pushes to `main`, `dev`, and `better-auth`; it provisions a dedicated disposable PostgreSQL database and runs lint, typecheck, tests, and build. The hosted GitHub run cannot be triggered or verified until changes are pushed. |

## Stage 0 status

| Item | Status | Evidence and remaining work |
| --- | --- | --- |
| 0A — Check the current implementation | Working | Branch, app smoke checks, deployment evidence, original build/lint issues and their local resolutions, feature map, and secret-free environment setup are recorded above and in this report. |
| 0B — Prove acceptable generation quality | Partial / blocked | A consent-first scorecard and comparison protocol are in [GENERATION_QUALITY_EVALUATION.md](./GENERATION_QUALITY_EVALUATION.md). Private face-image folders were identified but not accessed or transmitted. There is no approved spend cap, real-provider run, quality measurement, or business acceptance. The project owner must conduct any authorized real-provider evaluation in an environment they control before a pilot. |
| 0C — Start meaningful tests and checks | Partial | Vitest and 9 provider-mocked tests pass; lint, typecheck, and build pass locally; CI and a disposable test database are configured. The hosted GitHub workflow still needs a run, and tests should expand with each roadmap stage. |

## Roadmap feature status

**Working** means present and verified at this baseline; **partial** means there is relevant code, but a required behavior or verification is absent; **missing** means no implementation/evidence exists. Status is about the roadmap requirement, not a claim of production readiness.

| Roadmap item | Status | Evidence and remaining gap |
| --- | --- | --- |
| 0A — Check current implementation | Working | Branch, local startup, HTTP smoke checks, static checks, deployment evidence, integrations, and gaps recorded here. |
| 0B — Prove acceptable generation quality | Partial | A consented manual scorecard and evaluation protocol are ready. Still needs an approved spend cap, 10–15 consented sample cases, real-provider measurements, and business sign-off. |
| 0C — Start meaningful tests and checks | Partial | Vitest tests mock Prisma and image providers; local lint, typecheck, tests, build, and frozen-lockfile install pass. CI provisions an isolated test PostgreSQL database; the hosted workflow still needs a run, and integration tests and tests for further critical behaviors remain future work. |
| 1A — Better Auth and server permissions | Partial | Better Auth has email/password and Google provider configuration, auth pages/API, session lookup, admin role checks, and ownership checks in selected services. Real sign-in was not exercised; local auth secret/base URL are unset; expired-session continuation and full protected-resource coverage are not verified. |
| 1B — Ownership model and guest transfer | Partial | `Photo` and `Generation` have nullable user ownership and generation links to photo/wig. No guest-session ownership proof or idempotent transfer exists; no favorites or multi-photo/order schema exists. |
| 2A — Product and business content | Partial | Catalog and wig records exist. Approved launch details, five real photos per wig, availability, contact/location/hours, and content rights are not evidenced. |
| 2B — Catalog, gallery, wig administration | Partial | Catalog/detail pages and admin creation/upload exist. No product search/filter/pagination, five-image gallery, edit/archive/order/remove operations, or catalog administration lifecycle. |
| 3A — Photo instructions and preview | Partial | Upload/camera capture, instructions, client-side preview, and size optimization exist. Server-side file checks exist, but reliable face/brightness/framing checks, HEIC/orientation coverage, and phone testing are not verified. |
| 3B — Reliable generation and guest limit | Partial | Generation records have pending/completed/failed state, client polling, OpenAI generation, Cloudinary output storage, and optional Replicate segmentation. There is no server quota/guest allowance, atomic reservation, durable queue, retry/idempotency policy, failure refund, or cleanup. Generation is currently launched fire-and-forget from the route. |
| 3C — Result and WhatsApp actions | Partial | Result page, before/after slider, wig context, feedback form, and WhatsApp link exist. Guest-result transfer/save prompt, safe private-image sharing behavior, and verified phone behavior are not implemented/tested. |
| 4A — My Try Ons/history | Missing | No customer history page, pagination, deletion, or customer-specific list flow. |
| 4B — Favorites | Missing | Wig detail heart is local component state only; no persistence, Favorites page, or sign-in continuation. |
| 4C — Feedback and admin review | Partial | Signed-in feedback endpoint/service and admin feedback page exist. A unique/editable feedback policy, owner-only enforcement for unowned guest generations, retry deduplication, and admin filtering are missing. |
| 5A — Designer mobile fixes | Partial | A Hebrew RTL mobile-first interface exists. Designer review and checks for button stability, image contrast, and requested screen-specific fixes are not evidenced. |
| 5B — Mobile navigation and states | Partial | RTL pages and upload/result states exist. Navigation to history/favorites, accessibility review, progressive gallery loading, and iPhone/Android browser journeys are not complete. |
| 6A — Production deployment readiness | Partial | A past Vercel deployment is evidenced for the older `dev` commit only. No `better-auth` deployment, staging/production separation, reviewed migration plan, private image retrieval, spending cap, cleanup, backups, monitoring, or rollback evidence. |
| 6B — Customer handling rules | Missing | A result disclaimer exists, but no complete photo-processing/retention/deletion policy or customer deletion route is evidenced. |
| 6C — Controlled business pilot | Missing | No invited pilot, budget cap, business quality acceptance, or operational metrics are evidenced. |
| 7A — Release and portfolio presentation | Partial | A previous deployment exists for another branch. Current README/setup guidance is now documented; no approved live link for `better-auth`, mobile demo, screenshots, seeded demo, or pilot evidence. |
| P2 — Desktop design, appointments, expanded business pages/content, product categories | Missing (deferred) | The roadmap explicitly defers these until after MVP validation. |
| P2 — Cart, checkout, payment, delivery, custom ordering | Missing (separate project) | Not part of the MVP release scope. |
| P2 — AI FAQ chatbot, advanced marketing and analytics | Missing (separate project) | Not part of the MVP release scope. |

## Existing integrations to preserve

- **Authentication:** The selected branch is already on Better Auth. Avoid replacing it without a specific migration decision. `src/lib/auth.ts` configures Google and email/password, while `src/lib/api/auth.ts` resolves the session user and checks admin access.
- **Storage:** Cloudinary is already centralized in `src/lib/cloudinary.ts` and `src/lib/cloudinary-utils.ts`; photo and wig services call those helpers.
- **Schema:** Prisma/PostgreSQL already models users, wigs, photos, generations, feedback, and Better Auth tables. The Better Auth schema changes the prior NextAuth fields/types, so production data changes need an explicit migration plan.
- **Generation:** `src/services/generation.ts` uses OpenAI image editing, Sharp normalization/masks, optional Replicate hair segmentation, and Cloudinary output storage. Preserve this pipeline while adding the missing durable job/quota/quality controls.

## Environment setup

1. Install the pinned dependencies with `pnpm install --frozen-lockfile`.
2. Copy `.env.example` to the ignored local `.env`.
3. Fill in the provider credentials locally. For a real auth flow, set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and the credentials for the selected sign-in provider. Database, Cloudinary, and OpenAI settings are required for data-backed uploads and try-ons. Replicate variables are only needed when segmentation is enabled.
4. Use a disposable development PostgreSQL database. Review the Better Auth schema change before running `pnpm exec prisma db push`; do not run schema-sync commands against production.
5. Start with `pnpm run dev`. Run type and lint checks with the commands in the README; the repo currently has no test command.

The actual `.env` file was not read or reproduced. Store deployed secrets in the hosting provider's secret configuration, never in this document or a committed environment file.
