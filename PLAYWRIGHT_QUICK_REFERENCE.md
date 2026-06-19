# Playwright Testing - Quick Reference

## Run Tests

```bash
npm run test:e2e              # All tests (parallel)
npm run test:e2e:ui          # Interactive mode
npm run test:e2e:headed      # See browser
npm run test:e2e:smoke       # Auth + MPA list/create only
npx playwright test --debug  # Step through with debugger
```

## Write a Test

```typescript
import playwright from '@playwright/test'
import { setupApiMocks } from './helpers/mockApi'

const { test, expect } = playwright

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await setupApiMocks(page, { authenticated: true, role: 'admin' })
    await page.goto('/path')

    await page.getByRole('button', { name: 'Click' }).click()
    await expect(page.getByText('Success')).toBeVisible()
  })
})
```

## Find Elements

```typescript
// By role (best)
page.getByRole('button', { name: 'Save' })
page.getByRole('heading', { name: 'Title' })
page.getByLabel('Email')

// By text
page.getByText('Hello')

// By selector (avoid if possible)
page.locator('input#password')
```

## User Actions

```typescript
await page.goto('/path')
await page.getByLabel('Name').fill('John')
await page.getByLabel('Province').selectOption('Cebu')
await page.getByRole('button', { name: 'Save' }).click()
await page.reload()
```

## Assertions

```typescript
await expect(element).toBeVisible()
await expect(element).toHaveText('Text')
await expect(input).toHaveValue('value')
await expect(page).toHaveURL(/\/users$/)
await expect(page.getByRole('row')).toHaveCount(5)
```

## Authentication

```typescript
// Authenticated user
await setupApiMocks(page, { authenticated: true, role: 'admin' })

// Unauthenticated
await setupApiMocks(page, { authenticated: false })

// Different roles: 'admin', 'reviewer', 'guest'
```

## Debugging

```bash
npm run test:e2e:ui              # Recommended: see each step
npx playwright test --debug      # Debugger with Inspector
npx playwright show-report       # View HTML report after run
```

## File Location

- **Tests**: `tests/e2e/*.spec.ts`
- **Helpers**: `tests/e2e/helpers/`
- **Config**: `playwright.config.ts`
