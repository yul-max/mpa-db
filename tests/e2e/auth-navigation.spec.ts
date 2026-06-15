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

  test('keeps authenticated session across page reload', async ({ page }) => {
    await setupApiMocks(page, { authenticated: true, role: 'admin' });

    await page.goto('/mpa');
    await page.getByText('Log In').click();
    await page.getByLabel('Username').fill('ada');
    await page.locator('input#password').fill('secret');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('button', { name: 'Users' })).toBeVisible({ timeout: 5000 });

    await page.reload();
    await expect(page.getByRole('button', { name: 'User Profile' })).toBeVisible({ timeout: 5000 });
  });

  test('logs out and restores login affordance', async ({ page }) => {
    await setupApiMocks(page, { authenticated: true, role: 'admin' });

    await page.goto('/mpa');
    await page.getByText('Log In').click();
    await page.getByLabel('Username').fill('ada');
    await page.locator('input#password').fill('secret');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('button', { name: 'User Profile' })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: 'User Profile' }).click();
    await page.getByRole('button', { name: 'Log Out' }).click();

    await expect(page).toHaveURL(/\/mpa$/);
    await expect(page.getByText('Log In')).toBeVisible();
    await expect(page.getByRole('button', { name: 'User Profile' })).not.toBeVisible();
  });

  test('reviewer cannot see Users navigation button', async ({ page }) => {
    await setupApiMocks(page, { authenticated: true, role: 'reviewer' });

    await page.goto('/mpa');
    await expect(page.getByRole('heading', { name: 'MPA Records' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Users' })).not.toBeVisible();
  });
});
