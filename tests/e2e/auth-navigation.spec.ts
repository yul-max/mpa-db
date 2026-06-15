import playwright from '@playwright/test';
import { setupApiMocks } from './helpers/mockApi';

const { test, expect } = playwright;

test.describe('Authentication and navigation', () => {
  test('opens login drawer and signs in', async ({ page }) => {
    await setupApiMocks(page, { authenticated: false });

    await page.goto('/mpa');
    await expect(page.getByRole('heading', { name: 'MPA Records' })).toBeVisible();

    await page.getByText('Log In').click();
    await expect(page.getByText('Welcome Back')).toBeVisible();

    await page.getByLabel('Username').fill('ada');
    await page.locator('input#password').fill('secret');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Signed in successfully')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Users' })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'Users' }).click();
    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  });

  test('loads users page when navigating unauthenticated', async ({ page }) => {
    await setupApiMocks(page, { authenticated: false });

    await page.goto('/users');
    await expect(page).toHaveURL(/\/users$/);
  });
});
