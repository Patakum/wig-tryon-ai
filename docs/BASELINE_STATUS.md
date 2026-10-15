# Baseline and roadmap status

Reviewed 2026-10-12 against the current `better-auth` branch and the checked-in app state.

## Branch and deployment

- The repo is currently on the `better-auth` branch with the local feature work reflected in the working tree and recent commits.
- The app starts locally with the pinned dependencies. A fresh `pnpm run dev` is expected to serve on port 3001 when 3000 is occupied; login, signup, and the main landing route are still the principal smoke checks.
- The branch includes the Better Auth migration, guest-session ownership, and private-image API protection that are not present in the older `dev` branch state.
- Deployment evidence for `better-auth` is not yet established in this repo record; the older Vercel deployment on `dev` is therefore treated as historical evidence only, not proof of the current branch's production readiness.
- The roadmap document remains in the worktree as an untracked source artifact and was not modified as part of the app changes.

## Local verification

Commands were run on the current branch with the repository's locked dependencies. Secret values were not inspected or copied into this report.

| Check | Result |
| --- | --- |
| `pnpm run dev` | Starts locally; the app responds on the active port and the main auth routes can be smoke-tested. |
| `pnpm run build` | Compiles through TypeScript/Webpack, but the repository still has the known Node-memory issue during page-data collection on this machine. The underlying `face-api.js` dependency trace is still a known warning source. |
| `pnpm run typecheck` | Passes for the app and test files. |
| `pnpm run lint` | Passes. Earlier lint issues were fixed during the auth and guest-session work. |
| `pnpm test` | Passes: the suite includes ownership, guest-token hashing/expiry, redirect validation, and pending-job checks. |
| CI | `.github/workflows/ci.yml` provisions a disposable PostgreSQL database and runs lint, typecheck, tests, and build for `main`, `dev`, and `better-auth`. Hosted runs are not yet confirmed from this repo state. |

## Stage 0 status

| Item | Status | Evidence and remaining work |
| --- | --- | --- |
| 0A — Check the current implementation | Working | The actual branch state, app startup, auth flow, schema changes, and feature gaps are all reflected in the code and local checks. |
| 0B — Prove acceptable generation quality | Partial / blocked | The consent-first evaluation process and scorecard are documented in [GENERATION_QUALITY_EVALUATION.md](./GENERATION_QUALITY_EVALUATION.md), but the business approval, real-provider spend cap, and measured pilot sample set are still not in place. |
| 0C — Start meaningful tests and checks | Working / partial | Local lint, typecheck, and Vitest pass; CI is configured for PostgreSQL-backed verification. Build still hits the documented memory issue during page-data collection. |

## Roadmap feature status

**Working** means present and verified in the current branch; **partial** means the code exists but required verification or production controls are still missing; **missing** means no implementation/evidence exists. This status reflects the actual branch changes rather than the earlier baseline snapshot.

| Roadmap item | Status | Evidence and remaining gap |
| --- | --- | --- |
| 0A — Check current implementation | Working | The repo reflects the Better Auth migration, guest-session ownership, private-image routes, and the new auth tests. |
| 0B — Prove acceptable generation quality | Partial | The scorecard and process exist, but no approved pilot budget, sample evaluation, or business acceptance is recorded. |
| 0C — Start meaningful tests and checks | Working | Vitest tests cover ownership/redirect behavior, and lint/typecheck pass. CI and a real PostgreSQL test database are configured. Build remains a known memory issue in local page-data generation. |
| 1A — Better Auth and server permissions | Working | Email/password and optional Google OAuth are configured; session access and admin checks are server-controlled; protected image routes enforce ownership; guest sessions are browser-bound and validated through hashed tokens. |
| 1B — Ownership model and guest transfer | Partial | Guest-session ownership is implemented for `Photo` and `Generation`; idempotent guest-to-account transfer remains unimplemented, and there is still no favorites/multi-order model. |
| 2A — Product and business content | Partial | Catalog and wig records exist, but launch content, real-image galleries, rights, and operational business details are still not fully evidenced. |
| 2B — Catalog, gallery, wig administration | Partial | Admin creation/upload flows exist, but product search/filter/pagination, gallery completeness, and full admin lifecycle controls remain incomplete. |
| 3A — Photo instructions and preview | Partial | Upload, instructions, client preview, and size optimization are operational, but face-quality, brightness, HEIC/orientation coverage, and real-device checks remain unverified. |
| 3B — Reliable generation and guest limit | Partial | Generation records support pending/completed/failed states, client polling, OpenAI generation, Cloudinary output uploads, and optional Replicate segmentation. Durable queueing, atomic quotas, retry/idempotency, cleanup, and guest-allowance controls are still missing. |
| 3C — Result and WhatsApp actions | Partial | Result page, before/after slider, wig context, feedback form, and WhatsApp link are present. Guest transfer/save flow and verified phone-share safeguards still need completion. |
| 4A — My Try Ons/history | Missing | No customer history page or persistence flow is yet implemented. |
| 4B — Favorites | Missing | The wig detail heart is still UI-only; favorites persistence and page flow are not in the app. |
| 4C — Feedback and admin review | Partial | Signed-in feedback and admin feedback views exist, but dedupe, owner-only enforcement, and admin review policy are still incomplete. |
| 5A — Designer mobile fixes | Partial | Hebrew RTL mobile-first UI exists, but a full mobile design review and requested screen-level fixes are not evidenced. |
| 5B — Mobile navigation and states | Partial | Upload/result flows and RTL pages are present, but history/favorites navigation and deeper mobile-browser validation remain incomplete. |
| 6A — Production deployment readiness | Partial | No verified `better-auth` deployment is recorded. Production separation, migration rollout, private-image retrieval controls, and rollback/monitoring checks are not yet proven. |
| 6B — Customer handling rules | Missing | There is a result disclaimer, but a complete customer data-handling, retention, deletion, and consent policy is not evidenced. |
| 6C — Controlled business pilot | Missing | No pilot, cap, business sign-off, or operational measurement evidence is recorded. |
| 7A — Release and portfolio presentation | Partial | README setup guidance is now updated, but there is still no approved live app link, production demo, screenshots, or pilot evidence for the current branch. |
| P2 — Desktop design, appointments, expanded business pages/content, product categories | Missing (deferred) | Deferred until after MVP validation. |
| P2 — Cart, checkout, payment, delivery, custom ordering | Missing (separate project) | Outside current MVP scope. |
| P2 — AI FAQ chatbot, advanced marketing and analytics | Missing (separate project) | Outside current MVP scope. |

## Existing integrations to preserve

- **Authentication:** The branch is on Better Auth. Preserve the server-authorized auth flow and avoid replacing it without a specific migration decision. `src/lib/auth.ts` configures Google and email/password with server-side role enforcement, while `src/lib/api/auth.ts` resolves the session and checks admin access.
- **Storage:** Cloudinary is centralized in `src/lib/cloudinary.ts` and `src/lib/cloudinary-utils.ts`; the app routes use those helpers rather than direct SDK calls from pages or components.
- **Schema:** Prisma/PostgreSQL models users, guest sessions, wigs, photos, generations, feedback, and Better Auth tables. The schema change is additive for guest ownership and should be treated as a reviewed migration decision in production.
- **Generation:** `src/services/generation.ts` still represents the main generation pipeline: OpenAI image editing, Sharp normalization/masks, optional Replicate hair segmentation, and Cloudinary output storage. Preserve the pipeline while implementing the missing queueing, quota, and quality controls.

## Environment setup

1. Install the pinned dependencies with `pnpm install --frozen-lockfile`.
2. Copy `.env.example` to the ignored local `.env` file.
3. Fill in provider credentials locally. Set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and any selected provider credentials; database, Cloudinary, and OpenAI values are required for uploads and try-on generation. Replicate variables are only needed when segmentation is enabled.
4. Use a disposable PostgreSQL development database. Review the schema before applying `pnpm exec prisma db push`; do not target production with schema-sync commands.
5. Start with `pnpm run dev`, then run `pnpm run typecheck`, `pnpm run lint`, and `pnpm test` as the project’s verification flow.

The actual `.env` file was not read or reproduced. Store deployed secrets in the hosting provider’s secret configuration, never in this document or in a committed environment file.
