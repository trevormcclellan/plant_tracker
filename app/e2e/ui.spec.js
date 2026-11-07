import { test, expect } from '@playwright/test';
const plant = { _id: '123456789012345678901234', name: 'Fern', actions: [], flagged: false };
async function signedIn(page) {
  await page.addInitScript(() => { localStorage.setItem('token', 'test-session'); localStorage.setItem('username', 'alice'); });
}
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

test('failed login shows an inline error and allows retry', async ({ page }) => {
  await page.route('**/api/auth/login', route => json(route, { msg: 'Unauthorized' }, 401));
  await page.goto('/login');
  await page.getByLabel('Username:').fill('alice');
  await page.getByLabel('Password:', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Check your username and password');
  await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeEnabled();
});

test('load failure can be retried and empty search is explained', async ({ page }) => {
  await signedIn(page);
  let attempts = 0;
  await page.route('**/api/plants', route => ++attempts === 1 ? json(route, {}, 500) : json(route, [plant]));
  await page.goto('/');
  await page.getByRole('button', { name: 'Retry loading plants' }).click();
  await expect(page.getByRole('link', { name: 'Fern', exact: true })).toBeVisible();
  await page.getByRole('searchbox').fill('missing');
  await expect(page.getByText('No plants match your search.')).toBeVisible();
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.getByRole('link', { name: 'Fern', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.route(`**/api/plant/${plant._id}`, route => json(route, plant));
  await page.getByRole('link', { name: 'Fern', exact: true }).click();
  const back = page.getByRole('navigation').getByRole('link', { name: 'Back to plants' });
  await expect(back).toHaveClass(/btn-outline-success/);
  await back.click();
  await expect(page.getByRole('heading', { name: 'Plants', exact: true })).toBeVisible();
});

test('care failures are visible and successful retry updates the card', async ({ page }) => {
  await signedIn(page);
  await page.route('**/api/plants', route => json(route, [plant]));
  let attempts = 0;
  await page.route('**/api/plant/*/water', async route => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return ++attempts === 1 ? json(route, {}, 500) : json(route, { ...plant, actions: [{ type: 'Watered', time: new Date().toISOString() }] });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Water', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Water', exact: true })).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('Could not record watering');
  await page.getByRole('button', { name: 'Water', exact: true }).click();
  await expect(page.getByText('Last Action: Watered', { exact: false })).toBeVisible();
  expect(attempts).toBe(2);
  await expect(page.getByText('Care recorded.', { exact: true })).toBeVisible();
  await expect(page.getByText('Care recorded.', { exact: true })).not.toBeVisible({ timeout: 4500 });
  await page.route('**/api/plant/*/flag', route => json(route, { ...plant, flagged: true }));
  await page.getByRole('button', { name: 'Flag Fern', exact: true }).click();
  await expect(page.getByText('Flag updated.', { exact: true })).toBeVisible();
  await expect(page.getByText('Flag updated.', { exact: true })).not.toBeVisible({ timeout: 4500 });
});

test('failed add preserves the form and modal supports keyboard dismissal', async ({ page }) => {
  await signedIn(page);
  await page.route('**/api/plants', route => json(route, []));
  await page.route('**/api/plant', route => json(route, {}, 500));
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Plant', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill('New fern');
  await dialog.getByRole('button', { name: /Add Plant|Submit|Save/ }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(dialog.getByRole('textbox')).toHaveValue('New fern');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

test('invalid sessions redirect to login with an explanation', async ({ page }) => {
  await signedIn(page);
  await page.route('**/api/plants', route => json(route, {}, 401));
  await page.goto('/');
  await expect(page).toHaveURL(/login\?expired=1/);
  await expect(page.getByRole('status')).toContainText('session is no longer valid');
});

test('plant loading uses the overlay and removes it after a failure', async ({ page }) => {
  await signedIn(page);
  let finishLoading;
  const loading = new Promise(resolve => { finishLoading = resolve; });
  await page.route('**/api/plants', async route => {
    await loading;
    await json(route, {}, 500);
  });
  await page.goto('/');
  const overlay = page.getByRole('status', { name: 'Loading plants' });
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveCSS('position', 'fixed');
  await expect(overlay.locator('.spinner-border')).toBeVisible();
  finishLoading();
  await expect(overlay).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry loading plants' })).toBeVisible();
});

test('adding a plant briefly shows success with a minimal navigation bar', async ({ page }) => {
  await signedIn(page);
  await page.route('**/api/plants', route => json(route, []));
  await page.route('**/api/plant', route => json(route, [plant], 201));
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Plant navigation' })).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('link')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Refresh plants', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Logout', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add Plant', exact: true }).click();
  await page.getByRole('dialog').getByRole('textbox').fill('Fern');
  await page.getByRole('dialog').getByRole('button', { name: 'Submit', exact: true }).click();
  const success = page.getByRole('status').filter({ hasText: 'Plant added successfully.' });
  await expect(success).toBeVisible();
  await expect(page.getByRole('link', { name: 'Fern', exact: true })).toBeVisible();
  await expect(success).not.toBeVisible({ timeout: 4500 });
});
