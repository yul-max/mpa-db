import playwright from '@playwright/test';
import { setAuthCookies, setupApiMocks } from './helpers/mockApi';

const { test, expect } = playwright;

test.describe('MPA list and create workflow', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, { authenticated: true, role: 'admin' });
    await setAuthCookies(page, 'admin');
  });

  test('opens export modal and cancels', async ({ page }) => {
    await page.goto('/mpa');

    await expect(page.getByRole('heading', { name: 'MPA Records' })).toBeVisible();
    await page.getByRole('button', { name: 'Export' }).click();

    await expect(page.getByRole('heading', { name: 'Export CSV' })).toBeVisible();
    await expect(page.getByText('Visible columns in CSV:')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('heading', { name: 'Export CSV' })).not.toBeVisible();
  });

  test('adds and removes multiple ordinance links in create form', async ({ page }) => {
    await page.goto('/mpa');

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'Create MPA' })).toBeVisible();

    await page.getByRole('button', { name: 'More Info' }).click();
    await expect(page.getByText('Ordinance Information')).toBeVisible();

    await page.getByRole('button', { name: 'Add more' }).click();

    await expect(page.getByLabel('Ordinance Link 2')).toBeVisible();
    await expect(page.getByLabel('Ordinance Name 2')).toBeVisible();

    await page.locator('.ordinance-row').nth(1).getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByLabel('Ordinance Link 2')).not.toBeVisible();
  });
});
