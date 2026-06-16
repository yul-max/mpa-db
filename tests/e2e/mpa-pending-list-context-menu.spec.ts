import playwright from '@playwright/test';
import { setAuthCookies, setupApiMocks } from './helpers/mockApi';

const { test, expect } = playwright;

test.describe('Pending list context-menu actions', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, { authenticated: true, role: 'admin' });
    await setAuthCookies(page, 'admin');
  });

  test('opens approve and reject modals from pending list row context menu', async ({ page }) => {
    await page.goto('/mpa');
    await expect(page.getByRole('heading', { name: 'MPA Records' })).toBeVisible();

    await page.getByRole('button', { name: 'Pending Approval' }).click();
    await expect(page.getByRole('heading', { name: 'Pending MPAs' })).toBeVisible();

    const firstRow = page.locator('.p-datatable-tbody tr').first();

    await firstRow.click({ button: 'right' });
    await page.locator('.context-menu .menu-item:has-text("Approve MPA")').click();
    await expect(page.getByRole('heading', { name: /Approve MPA:/ })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await firstRow.click({ button: 'right' });
    await page.locator('.context-menu .menu-item:has-text("Reject MPA")').click();
    await expect(page.getByRole('heading', { name: /Reject MPA:/ })).toBeVisible();
  });

  test('completes approve flow from pending list context menu', async ({ page }) => {
    await page.goto('/mpa');
    await page.getByRole('button', { name: 'Pending Approval' }).click();
    await expect(page.getByRole('heading', { name: 'Pending MPAs' })).toBeVisible();

    const firstRow = page.locator('.p-datatable-tbody tr').first();
    await firstRow.click({ button: 'right' });
    await page.locator('.context-menu .menu-item:has-text("Approve MPA")').click();
    await expect(page.getByRole('heading', { name: /Approve MPA:/ })).toBeVisible();

    await page.getByRole('button', { name: 'Approve MPA' }).click();
    await expect(page.getByRole('heading', { name: 'MPA Approved' })).toBeVisible();
  });

  test('completes reject flow from pending list context menu', async ({ page }) => {
    await page.goto('/mpa');
    await page.getByRole('button', { name: 'Pending Approval' }).click();

    const firstRow = page.locator('.p-datatable-tbody tr').first();
    await firstRow.click({ button: 'right' });
    await page.locator('.context-menu .menu-item:has-text("Reject MPA")').click();
    await expect(page.getByRole('heading', { name: /Reject MPA:/ })).toBeVisible();

    await page.getByLabel('Rejection Reason').fill('Insufficient details');
    await page.getByRole('button', { name: 'Reject MPA' }).click();
    await expect(page.getByRole('heading', { name: 'MPA Rejected' })).toBeVisible();
  });

  test('closes context menu when clicking outside', async ({ page }) => {
    await page.goto('/mpa');
    await page.getByRole('button', { name: 'Pending Approval' }).click();

    const firstRow = page.locator('.p-datatable-tbody tr').first();
    await firstRow.click({ button: 'right' });
    await expect(page.locator('.context-menu.menu-open')).toBeVisible();

    await page.locator('.context-menu-overlay').click();
    await expect(page.locator('.context-menu.menu-open')).not.toBeVisible();
  });
});
