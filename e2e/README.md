# End-to-end journeys (Playwright)

These tests drive the real app in a browser on phone-sized screens: mobile
Chrome (Pixel 7) and mobile Safari (iPhone 14, WebKit).

## No billable calls

The server runs in **fake-provider mode** (`E2E_FAKE_PROVIDERS=1`):

- Cloudinary is replaced by an in-memory image store.
- OpenAI is replaced by a generated sample image. A wig whose name starts
  with `[fail]` simulates a provider failure, `[quota]` exhausted credits.
- The browser's face-detection model files are blocked; that check fails open
  by design, so no real face photo is needed.

Fake mode refuses to run next to real provider credentials
(`OPENAI_API_KEY`, `CLOUDINARY_API_SECRET`): the server stops at boot.
`playwright.config.ts` also blanks those variables for the test server.
Fake mode also disables auth rate limiting and Secure cookies, because the
tests run over plain http on localhost.

## Journeys

| File | Journey |
| --- | --- |
| `guest-limit.spec.ts` | Guest browses, uploads, gets one result, opens WhatsApp, is asked to sign in to generate again; a double tap creates one job |
| `signin-claim-feedback.spec.ts` | Guest signs in from a result, history shows it once, feedback draft survives sign-in, admin reviews it, customer hides the result from admins |
| `favorites.spec.ts` | Guest favorite continues after sign-in, persists, is removed |
| `isolation.spec.ts` | Another account or visitor cannot read a customer's result, photo, feedback or history |
| `failure-recovery.spec.ts` | Failed generation and exhausted credits show guidance and alert the admin; losing the connection shows a banner and the retry works |

## Running locally

You need a disposable PostgreSQL database with the migrations applied. Every
test **truncates all tables**, so never point this at real data.

```bash
export DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/wig_tryon_e2e
export E2E_DATABASE_URL=$DATABASE_URL
export BETTER_AUTH_SECRET=e2e-only-secret BETTER_AUTH_URL=http://localhost:3001 NEXT_PUBLIC_APP_URL=http://localhost:3001
pnpm exec prisma migrate deploy
pnpm run build
pnpm exec playwright install chromium webkit   # first time only
pnpm run test:e2e
```

The app is started on port 3001 (an allowed Better Auth host). Rebuild after
changing app code: the tests run against `next start`.
