import playwright from '@playwright/test';
import { setupApiMocks } from './helpers/mockApi';

const { test, expect } = playwright;

const loginAsAdmin = async (page: playwright.Page) => {
  await page.goto('/mpa');
  await page.getByText('Log In').click();
  await expect(page.getByText('Welcome Back')).toBeVisible();
  await page.getByLabel('Username').fill('ada');
  await page.locator('input#password').fill('secret');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Signed in successfully')).toBeVisible();
};

test.describe('Users details page', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, { authenticated: true, role: 'admin' });
    await loginAsAdmin(page);
  });

  test('loads user details and navigates back', async ({ page }) => {
    await page.getByRole('button', { name: 'Users' }).click();
    await expect(page).toHaveURL(/\/users$/);

    await page.locator('.p-datatable-tbody tr').first().click();
    await expect(page).toHaveURL(/\/users\/1$/);

    await expect(page.getByRole('heading', { name: /Ada Admin|User Details/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back to Users' })).toBeVisible();

    await page.getByRole('button', { name: 'Back to Users' }).click();
    await expect(page).toHaveURL(/\/users$/);
  });
});
