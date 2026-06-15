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
  await expect(page.getByRole('button', { name: 'Users' })).toBeVisible({ timeout: 5000 });
};

test.describe('Users edit page flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, { authenticated: true, role: 'admin' });
    await loginAsAdmin(page);
  });

  test('navigates to users edit route and shows edit page heading', async ({ page }) => {
    await page.goto('/users/1/edit');

    await expect(page).toHaveURL(/\/users\/1\/edit$/);
    await expect(page.getByRole('heading', { name: 'Edit User' })).toBeVisible();
  });
});
