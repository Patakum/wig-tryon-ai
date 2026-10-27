import { test, expect } from './fixtures';
import { query, WIGS } from './helpers/db';
import {
  signUpViaApi,
  startTryOn,
  testUser,
  waitForResult,
} from './helpers/flow';

const FEEDBACK_BOX = 'כתוב את חוות דעתך...';

// Journey 4: a customer sees their own wig, feedback and result in history,
// and no other account (or visitor) can reach that result, photo or feedback.
test('history is private to its owner', async ({ page, browser }) => {
  await page.goto('/');
  await signUpViaApi(page, testUser('owner'));

  await startTryOn(page, WIGS.classic.id);
  await waitForResult(page);
  await page.getByPlaceholder(FEEDBACK_BOX).fill('פרטי');
  await page.getByRole('button', { name: 'שלח משוב' }).click();
  await expect(page.getByText('המשוב נשמר!')).toBeVisible();

  const [row] = await query<{ id: string; photoId: string }>(
    `SELECT id, "photoId" FROM "Generation"`,
  );

  // The owner's detail page shows the wig and the feedback.
  await page.goto(`/my-try-ons/${row.id}`);
  await expect(
    page.getByRole('link', { name: WIGS.classic.name }),
  ).toBeVisible();
  await expect(page.getByPlaceholder(FEEDBACK_BOX)).toHaveValue('פרטי');

  // Another signed-in customer is refused everywhere.
  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  await other.goto('/');
  await signUpViaApi(other, testUser('other'));

  const status = async (
    method: 'get' | 'post' | 'patch' | 'delete',
    path: string,
    data?: object,
  ) => (await other.request[method](path, data ? { data } : undefined)).status();

  expect(await status('get', `/api/generations/${row.id}/image`)).toBe(403);
  expect(await status('get', `/api/photos/${row.photoId}/image`)).toBe(403);
  expect(await status('get', `/api/generation?id=${row.id}`)).toBe(403);
  expect(
    await status('post', '/api/feedback', {
      generationId: row.id,
      message: 'x',
    }),
  ).toBe(403);
  expect(
    await status('patch', `/api/my-try-ons/${row.id}/privacy`, {
      adminCanSeeResult: false,
    }),
  ).toBe(403);
  expect(await status('delete', `/api/my-try-ons/${row.id}`)).toBe(403);
  expect(await status('get', `/api/admin/generations/${row.id}/result`)).toBe(
    403,
  );

  // The page shows "not found" (streamed, so the HTTP status can be 200)
  // and nothing of the owner's try-on.
  await other.goto(`/my-try-ons/${row.id}`);
  await expect(other.getByRole('heading', { name: 'העמוד לא נמצא' })).toBeVisible();
  await expect(other.getByText(WIGS.classic.name)).toHaveCount(0);
  await expect(other.getByPlaceholder(FEEDBACK_BOX)).toHaveCount(0);
  await other.goto('/my-try-ons');
  await expect(other.getByText('עדיין לא ניסית פאה.')).toBeVisible();
  await otherContext.close();

  // A visitor with no session cannot fetch the image either.
  const visitor = await browser.newContext();
  const res = await visitor.request.get(
    new URL(`/api/generations/${row.id}/image`, page.url()).toString(),
  );
  expect(res.status()).toBe(401);
  await visitor.close();

  // Nothing leaked or changed for the owner.
  expect(await query(`SELECT id FROM "Feedback"`)).toHaveLength(1);
  const [still] = await query<{ deletedAt: Date | null }>(
    `SELECT "deletedAt" FROM "Generation"`,
  );
  expect(still.deletedAt).toBeNull();
});
