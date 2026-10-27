import { test as base, expect } from '@playwright/test';
import { resetDatabase } from './helpers/db';

// Every test starts from the same seeded database. The browser's face
// detection model files are blocked: that check fails open when the model
// cannot load, so tests need no real face photo.
export const test = base.extend<{ resetAndBlockModels: void }>({
  resetAndBlockModels: [
    async ({ page }, use) => {
      await resetDatabase();
      await page.route('**/models/**', (route) => route.abort());
      await use();
    },
    { auto: true },
  ],
});

export { expect };
