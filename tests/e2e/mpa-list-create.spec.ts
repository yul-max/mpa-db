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

  test('disables export button when there are no records', async ({ page }) => {
    await page.route('**/datalist**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rows: [], count: 0 })
      });
    });

    await page.goto('/mpa');
    const exportButton = page.getByRole('button', { name: 'Export' });
    await expect(exportButton).toBeDisabled();
  });

  test('exports CSV with custom filename', async ({ page }) => {
    await page.goto('/mpa');

    await expect(page.getByRole('heading', { name: 'MPA Records' })).toBeVisible();
    await page.getByRole('button', { name: 'Export' }).click();
    await expect(page.getByRole('heading', { name: 'Export CSV' })).toBeVisible();

    await page.locator('#csv-filename').fill('MPA_Export');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV' }).click();
    const download = await downloadPromise;

    await expect(download.suggestedFilename()).toBe('MPA_Export.csv');
  });

  test('prevents export confirmation on invalid filename', async ({ page }) => {
    await page.goto('/mpa');

    await page.getByRole('button', { name: 'Export' }).click();
    await page.locator('#csv-filename').fill('invalid/name');

    await expect(page.getByText('Use letters, numbers, spaces, dash, or underscore only.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export CSV' })).toBeDisabled();
  });

  test('exports with active name filter and shows filtered-results confirmation message', async ({ page }) => {
    await page.goto('/mpa');

    await expect(page.getByRole('heading', { name: 'MPA Records' })).toBeVisible();

    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByRole('button', { name: 'Add Filter' }).click();
    await page.locator('.dropdown-menu .dropdown-item:has-text("Name")').click();

    await page.locator('.filter-input input').first().fill('Apo');

    await page.getByRole('button', { name: 'Export' }).click();
    await expect(page.getByRole('heading', { name: 'Export CSV' })).toBeVisible();
    await expect(page.getByText('You are about to export only the filtered results shown in the table as a CSV file.')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV' }).click();
    const download = await downloadPromise;
    await expect(download.suggestedFilename()).toContain('MPAList_');
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

  test('blocks submit when ordinance name is provided without link', async ({ page }) => {
    await page.goto('/mpa');

    await page.getByRole('button', { name: 'Create' }).click();

    await page.getByLabel('MPA Name').fill('Validation MPA');
    await page.getByLabel('Year Established').fill('2024');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'sample.geojson',
      mimeType: 'application/json',
      buffer: Buffer.from('{"type":"FeatureCollection","features":[]}')
    });

    await page.getByRole('button', { name: 'More Info' }).click();

    await page.getByLabel('Ordinance Name').fill('Only Name');
    await page.getByRole('button', { name: 'Create MPA' }).click();

    await expect(page.getByText('Ordinance link is required when name is provided')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create MPA' })).toBeVisible();
  });

  test('shows discard confirmation from create MPA modal and keeps editing when canceled', async ({ page }) => {
    await page.goto('/mpa');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'Create MPA' })).toBeVisible();

    await page.getByLabel('MPA Name').fill('Temp MPA');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('heading', { name: 'Discard changes?' })).toBeVisible();
    await page.getByRole('button', { name: 'Keep editing' }).click();
    await expect(page.getByRole('heading', { name: 'Create MPA' })).toBeVisible();
  });
});
