import { test, expect } from './fixtures';
import { makeAdmin, query, WIGS } from './helpers/db';
import {
  signInViaUi,
  signUpViaApi,
  startTryOn,
  testUser,
  waitForResult,
} from './helpers/flow';

const FEEDBACK = 'התוצאה יפה מאוד';
const FEEDBACK_BOX = 'כתוב את חוות דעתך...';

// Journey 2: a guest signs in from a result, the result appears once in
// history, feedback is submitted and an admin can review it with context.
test('guest signs in from a result, keeps it once in history, and the admin sees the feedback', async ({
  page,
  browser,
}) => {
  const customer = testUser('customer');

  // An existing account, created in its own browser context so this page
  // stays a guest.
  const accountContext = await browser.newContext();
  const accountPage = await accountContext.newPage();
  await accountPage.goto('/');
  await signUpViaApi(accountPage, customer);
  await accountContext.close();

  // The guest generates a result, then writes feedback.
  await startTryOn(page, WIGS.classic.id);
  await waitForResult(page);
  await page.getByPlaceholder(FEEDBACK_BOX).fill(FEEDBACK);
  await page.getByRole('button', { name: 'שלח משוב' }).click();

  // Guests are sent to sign in; the draft survives the round trip.
  await expect(page).toHaveURL(/\/login\?next=/);
  await signInViaUi(page, customer);
  await expect(page).toHaveURL(/\/result\?id=/);
  await expect(page.getByPlaceholder(FEEDBACK_BOX)).toHaveValue(FEEDBACK);
  await page.getByRole('button', { name: 'שלח משוב' }).click();
  await expect(page.getByText('המשוב נשמר!')).toBeVisible();

  // The existing result is in the account's history exactly once.
  await page.goto('/my-try-ons');
  await expect(page.locator('a[href^="/my-try-ons/"]')).toHaveCount(1);
  await expect(page.getByText('משוב נשלח')).toBeVisible();
  await page.reload();
  await expect(page.locator('a[href^="/my-try-ons/"]')).toHaveCount(1);

  const [owner] = await query<{ id: string }>(
    `SELECT id FROM "User" WHERE email = $1`,
    [customer.email],
  );
  const generations = await query<{ id: string; userId: string }>(
    `SELECT id, "userId" FROM "Generation"`,
  );
  expect(generations).toHaveLength(1);
  expect(generations[0].userId).toBe(owner.id);
  expect(await query(`SELECT id FROM "Feedback"`)).toHaveLength(1);

  // An admin reviews the feedback with its context.
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  const admin = testUser('admin');
  await adminPage.goto('/');
  await signUpViaApi(adminPage, admin);
  await makeAdmin(admin.email);

  await adminPage.goto('/admin/feedbacks');
  await expect(adminPage.getByText(FEEDBACK)).toBeVisible();
  await expect(adminPage.getByText(customer.email)).toBeVisible();
  await expect(adminPage.getByText(`Wig: ${WIGS.classic.name}`)).toBeVisible();
  await expect(adminPage.locator('img[alt="Result"]')).toBeVisible();

  // The customer can hide the result from admins; the admin route then refuses.
  await page.goto(`/my-try-ons/${generations[0].id}`);
  await page.getByRole('switch', { name: /לראות את התוצאה/ }).uncheck();
  await expect
    .poll(async () => {
      const [row] = await query<{ adminCanSeeResult: boolean }>(
        `SELECT "adminCanSeeResult" FROM "Generation"`,
      );
      return row.adminCanSeeResult;
    })
    .toBe(false);

  await adminPage.reload();
  await expect(adminPage.getByText('Hidden by the customer')).toBeVisible();
  const hidden = await adminPage.request.get(
    `/api/admin/generations/${generations[0].id}/result`,
  );
  expect(hidden.status()).toBe(403);

  await adminContext.close();
});
