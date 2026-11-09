import { test, expect } from './fixtures';
import { query, WIGS } from './helpers/db';
import {
  GENERATE_LABEL,
  selectSelfie,
  uploadSelfie,
  waitForResult,
} from './helpers/flow';

// Journey 1: a guest browses, inspects the gallery, uploads, gets one result,
// opens WhatsApp without signing in, and is asked to sign in to generate again.
test('guest gets one result, can open WhatsApp, then is asked to sign in', async ({
  page,
}) => {
  // Browse the catalog and open a wig.
  await page.goto('/catalog');
  await page.locator(`a[href="/wigs/${WIGS.classic.id}"]`).click();
  await expect(page.getByRole('heading', { name: WIGS.classic.name })).toBeVisible();

  // The classic wig has two photos, so the gallery shows indicators.
  await expect(page.getByRole('button', { name: /תמונה 1 מתוך 2/ })).toBeVisible();
  await page.getByRole('button', { name: /תמונה 2 מתוך 2/ }).click();

  // Instructions -> upload -> consent -> generate.
  await page.getByRole('link', { name: 'נסי עליך' }).click();
  await page.getByRole('link', { name: 'המשיכי' }).click();
  await expect(page).toHaveURL(/\/upload\?wigId=/);

  // The upload button stays disabled until the privacy box is ticked.
  await selectSelfie(page);
  const send = page.getByRole('button', { name: 'שלח תמונה' });
  await expect(send).toBeDisabled();
  await page.getByRole('checkbox', { name: /מדיניות הפרטיות/ }).check();
  await expect(send).toBeEnabled();
  await send.click();

  await page.getByRole('button', { name: GENERATE_LABEL }).click();
  await waitForResult(page);

  // The WhatsApp link opens the business chat with the wig name, no login.
  const whatsapp = page.getByRole('link', { name: /WhatsApp/ });
  await expect(whatsapp).toBeVisible();
  const href = (await whatsapp.getAttribute('href')) ?? '';
  expect(href).toContain('https://wa.me/972500000000');
  expect(decodeURIComponent(href)).toContain(WIGS.classic.name);

  // The result is an image served through the private route.
  const resultSrc = await page
    .locator('img[src*="/api/generations/"]')
    .first()
    .getAttribute('src');
  expect(resultSrc).toBeTruthy();
  const image = await page.request.get(resultSrc as string);
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toContain('image/jpeg');

  // Exactly one generation exists for this guest.
  const rows = await query<{ status: string }>(`SELECT status FROM "Generation"`);
  expect(rows).toEqual([{ status: 'completed' }]);

  // Trying again as a guest asks for sign-in instead of generating.
  await page.goto(`/upload?wigId=${WIGS.second.id}`);
  await uploadSelfie(page);
  await page.getByRole('button', { name: GENERATE_LABEL }).click();
  await expect(
    page.getByRole('heading', { name: 'התחבר כדי ליצור תמונה נוספת' }),
  ).toBeVisible();

  const after = await query(`SELECT id FROM "Generation"`);
  expect(after).toHaveLength(1);
});

// Roadmap: concurrent requests must not create extra jobs.
test('a double tap on generate creates a single job', async ({ page }) => {
  await page.goto(`/upload?wigId=${WIGS.classic.id}`);
  await uploadSelfie(page);

  await page.getByRole('button', { name: GENERATE_LABEL }).dblclick();
  await waitForResult(page);

  const rows = await query(`SELECT id FROM "Generation"`);
  expect(rows).toHaveLength(1);
});
