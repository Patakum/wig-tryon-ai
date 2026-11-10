import { defineConfig, devices } from '@playwright/test';

// Port 3001 is one of the hosts Better Auth accepts in src/lib/auth.ts.
const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  'postgresql://wig_test:wig_test@localhost:5432/wig_tryon_test';

// End-to-end journeys run against a production build with fake Cloudinary and
// OpenAI (E2E_FAKE_PROVIDERS=1), a disposable database and no provider keys,
// so no test can make a billable call. Build first: pnpm run build.
export default defineConfig({
  testDir: './e2e',
  // One shared database and server, so tests run one at a time.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      BETTER_AUTH_SECRET: 'e2e-only-secret-not-for-deployment',
      BETTER_AUTH_URL: BASE_URL,
      NEXT_PUBLIC_APP_URL: BASE_URL,
      E2E_FAKE_PROVIDERS: '1',
      E2E_FAKE_GENERATION_DELAY_MS: '1200',
      WHATSAPP_PHONE: '972500000000',
      GENERATION_DAILY_LIMIT: '3',
      // Real credentials must never reach the fake-provider server.
      OPENAI_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_CLOUD_NAME: '',
      REPLICATE_API_TOKEN: '',
      REPLICATE_HAIR_SEGMENTATION_MODEL: '',
    },
  },
});
