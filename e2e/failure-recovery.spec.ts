import { test, expect } from './fixtures';
import { makeAdmin, query, WIGS } from './helpers/db';
import {
  GENERATE_LABEL,
  selectSelfie,
  signUpViaApi,
  startTryOn,
  testUser,
  waitForResult,
} from './helpers/flow';

// Journey 5: when generation fails or the network drops, the customer gets
// recovery guidance, and a retry neither duplicates jobs nor burns the
// allowance.
test('a failed generation shows guidance and does not use the guest allowance', async ({
  page,
}) => {
  await startTryOn(page, WIGS.failing.id);
  await expect(page.getByText('משהו השתבש')).toBeVisible({ timeout: 45_000 });

  // The retry link leads back to the upload step for the same wig.
  await page.getByRole('link', { name: 'נסי שוב' }).click();
  await expect(page).toHaveURL(new RegExp(`/upload\\?wigId=${WIGS.failing.id}`));

  // The guest allowance was refunded: a working wig now succeeds.
  await startTryOn(page, WIGS.classic.id);
  await waitForResult(page);

  const rows = await query<{ status: string }>(
    `SELECT status FROM "Generation" ORDER BY "createdAt"`,
  );
  expect(rows.map((r) => r.status)).toEqual(['failed', 'completed']);
});

test('exhausted credits tell the customer to try later and alert the admin', async ({
  page,
  browser,
}) => {
  await startTryOn(page, WIGS.noCredits.id);
  await expect(page.getByText('השירות לא זמין כרגע')).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByText(/עדכנו את צוות האתר/)).toBeVisible();

  const [row] = await query<{ status: string; failureReason: string }>(
    `SELECT status, "failureReason" FROM "Generation"`,
  );
  expect(row).toEqual({ status: 'failed', failureReason: 'quota' });

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  const admin = testUser('alerts-admin');
  await adminPage.goto('/');
  await signUpViaApi(adminPage, admin);
  await makeAdmin(admin.email);

  await adminPage.goto('/admin');
  await expect(
    adminPage.getByText(/Image generation credits have run out/),
  ).toBeVisible();
  await adminPage.goto('/admin/alerts');
  await expect(
    adminPage.getByText('Generation credits ran out').first(),
  ).toBeVisible();
  await adminContext.close();
});

test('losing the connection shows a banner, and the retry works', async ({
  page,
  context,
}) => {
  await page.goto(`/upload?wigId=${WIGS.classic.id}`);
  await selectSelfie(page);
  await page.getByRole('checkbox', { name: /מדיניות הפרטיות/ }).check();

  await context.setOffline(true);
  await expect(page.getByText(/אין חיבור לאינטרנט/)).toBeVisible();
  await page.getByRole('button', { name: 'שלח תמונה' }).click();
  await expect(page.getByText('העלאה נכשלה. אנא נסה שנית.')).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByText('החיבור חזר.')).toBeVisible();

  // The retry succeeds and uses exactly one allowance.
  await page.getByRole('button', { name: 'שלח תמונה' }).click();
  await page.getByRole('button', { name: GENERATE_LABEL }).click();
  await waitForResult(page);
  expect(await query(`SELECT id FROM "Generation"`)).toHaveLength(1);
  expect(await query(`SELECT id FROM "Photo"`)).toHaveLength(1);
});
