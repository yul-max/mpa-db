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

const openCreateUserModal = async (page: playwright.Page) => {
  await page.getByRole('button', { name: 'Users' }).click();
  await expect(page).toHaveURL(/\/users$/);

  const createButton = page.getByRole('button', { name: 'Create' });
  const modalHeading = page.getByRole('heading', { name: 'Create User' });

  await expect(createButton).toBeVisible();
  await createButton.click();

  // Some runs miss the first click due transient overlays; retry once before failing.
  if (!(await modalHeading.isVisible())) {
    await createButton.click();
  }

  await expect(modalHeading).toBeVisible();
};

test.describe('Users list and create modal', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page, { authenticated: true, role: 'admin' });
    await loginAsAdmin(page);
  });

  test('opens and submits Create User modal', async ({ page }) => {
    await openCreateUserModal(page);
    await page.getByLabel('Username').fill('new.user');
    await page.getByLabel('Email').fill('new.user@example.com');
    await page.getByRole('button', { name: 'Create User' }).click();

    await expect(page.getByRole('heading', { name: 'Create User' })).not.toBeVisible();
    await expect(page).toHaveURL(/\/users$/);
  });

  test('disables Create User submit with invalid email', async ({ page }) => {
    await openCreateUserModal(page);

    await page.getByLabel('Email').fill('invalid-email');
    await expect(page.getByRole('button', { name: 'Create User' })).toBeDisabled();
  });

  test('closes create modal immediately when form is not dirty', async ({ page }) => {
    await openCreateUserModal(page);

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Create User' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Discard changes?' })).not.toBeVisible();
  });

  test('opens discard confirmation when canceling dirty Create User modal', async ({ page }) => {
    await openCreateUserModal(page);

    await page.getByLabel('Username').fill('dirty.user');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('heading', { name: 'Discard changes?' })).toBeVisible();
    await page.getByRole('button', { name: 'Discard' }).click();

    await expect(page.getByRole('heading', { name: 'Create User' })).not.toBeVisible();
  });

  test('keeps create modal open when choosing Keep editing on discard prompt', async ({ page }) => {
    await openCreateUserModal(page);

    await page.getByLabel('Username').fill('dirty.user');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('heading', { name: 'Discard changes?' })).toBeVisible();
    await page.getByRole('button', { name: 'Keep editing' }).click();
    await expect(page.getByRole('heading', { name: 'Create User' })).toBeVisible();
  });
});
