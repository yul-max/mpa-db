import playwright from '@playwright/test';
import { setAuthCookies, setupApiMocks } from './helpers/mockApi';

const { test, expect } = playwright;

test.describe('Pending MPA details actions', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, { authenticated: true, role: 'admin' });
    await setAuthCookies(page, 'admin');
  });

  test('opens approve and reject flows from Actions dropdown', async ({ page }) => {
    await page.goto('/mpa/pending/101');

    await expect(page.getByRole('button', { name: 'Actions' })).toBeVisible();

    await page.getByRole('button', { name: 'Actions' }).click();
    await page.locator('.dropdown-menu:visible .dropdown-item:has-text("Approve")').click();
    await expect(page.getByRole('heading', { name: /Approve MPA:/ })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await page.getByRole('button', { name: 'Actions' }).click();
    await page.locator('.dropdown-menu:visible .dropdown-item:has-text("Reject")').click();
    await expect(page.getByRole('heading', { name: /Reject MPA:/ })).toBeVisible();

    await page.getByLabel('Rejection Reason').fill('Missing ordinance document reference');
    await page.getByRole('button', { name: 'Reject MPA' }).click();

    await expect(page.getByRole('heading', { name: 'MPA Rejected' })).toBeVisible();
  });
});
