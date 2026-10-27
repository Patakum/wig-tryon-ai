import { test, expect } from './fixtures';
import { WIGS } from './helpers/db';
import { signInViaUi, signUpViaApi, testUser } from './helpers/flow';

// Journey 3: a guest taps the heart, signs in, the wig is saved, then it is
// removed from Favorites and a refresh confirms the removal.
test('guest favorite continues after sign-in and can be removed', async ({
  page,
  browser,
}) => {
  const customer = testUser('fan');
  const accountContext = await browser.newContext();
  const accountPage = await accountContext.newPage();
  await accountPage.goto('/');
  await signUpViaApi(accountPage, customer);
  await accountContext.close();

  // Cancelling sign-in must not show a saved heart.
  await page.goto(`/wigs/${WIGS.classic.id}`);
  await page.getByRole('button', { name: 'הוסיפי למועדפים' }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.goBack();
  await expect(
    page.getByRole('button', { name: 'הוסיפי למועדפים' }),
  ).toHaveAttribute('aria-pressed', 'false');

  // Tap again and sign in: the intended wig is saved on return.
  await page.getByRole('button', { name: 'הוסיפי למועדפים' }).click();
  await signInViaUi(page, customer);
  // The page saves the favorite, then drops the ?favorite=1 marker.
  await expect(page).toHaveURL(new RegExp(`/wigs/${WIGS.classic.id}$`));
  await expect(
    page.getByRole('button', { name: 'הסירי מהמועדפים' }),
  ).toHaveAttribute('aria-pressed', 'true');

  // It persists across a refresh and is listed on the Favorites page.
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'הסירי מהמועדפים' }),
  ).toBeVisible();
  await page.goto('/favorites');
  await expect(
    page.locator(`a[href="/wigs/${WIGS.classic.id}"]`),
  ).toBeVisible();

  // Remove it; a refresh confirms the removal.
  await page
    .getByRole('button', { name: `הסירי את ${WIGS.classic.name} מהמועדפים` })
    .click();
  await expect(page.getByText('עדיין לא שמרת פאות במועדפים.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('עדיין לא שמרת פאות במועדפים.')).toBeVisible();
});
