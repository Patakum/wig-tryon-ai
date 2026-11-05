import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { makeSelfie } from './selfie';

export type TestUser = { name: string; email: string; password: string };

export function testUser(label: string): TestUser {
  return {
    name: `Test ${label}`,
    email: `${label}-${Date.now()}@example.test`,
    password: 'correct-horse-battery',
  };
}

// Signs up through the API and keeps the session cookie in the page's context.
export async function signUpViaApi(page: Page, user: TestUser) {
  const baseURL = new URL(page.url() === 'about:blank' ? 'http://localhost:3001' : page.url()).origin;
  const res = await page.request.post('/api/auth/sign-up/email', {
    data: { name: user.name, email: user.email, password: user.password },
    headers: { Origin: baseURL },
  });

  expect(res.ok(), `sign-up failed: ${await res.text()}`).toBe(true);
}

export async function signInViaUi(page: Page, user: TestUser) {
  await page.getByLabel('אימייל').fill(user.email);
  await page.getByLabel('סיסמה', { exact: false }).first().fill(user.password);
  await page.getByRole('button', { name: 'התחבר', exact: true }).click();
}

// Picks a selfie file in the upload step.
export async function selectSelfie(page: Page) {
  await page.locator('input[type="file"]').setInputFiles({
    name: 'selfie.jpg',
    mimeType: 'image/jpeg',
    buffer: await makeSelfie(),
  });
}

// Picks a selfie, ticks the privacy consent box and uploads it.
export async function uploadSelfie(page: Page) {
  await selectSelfie(page);

  await page.getByRole('checkbox', { name: /מדיניות הפרטיות/ }).check();
  await page.getByRole('button', { name: 'שלח תמונה' }).click();
}

export const GENERATE_LABEL = 'תראה לי את עצמי עם הפאה!';

// From a wig page: instructions -> upload -> generate. Stops on the result
// (or loading) page.
export async function startTryOn(page: Page, wigId: string) {
  await page.goto(`/upload?wigId=${wigId}`);
  await uploadSelfie(page);
  await page.getByRole('button', { name: GENERATE_LABEL }).click();
}

export async function waitForResult(page: Page) {
  await expect(page.getByRole('heading', { name: 'התוצאה שלך' })).toBeVisible({
    timeout: 45_000,
  });
}
