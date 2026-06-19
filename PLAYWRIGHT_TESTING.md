# Playwright Testing Guide

This guide covers how to create, run, and debug Playwright tests for the MPA Database application.

## Quick Start

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run smoke tests (critical paths only)
npm run test:e2e:smoke

# Run tests in CI mode (single worker, 2 retries)
npm run test:e2e:full:ci
```

### Test Files

- Location: `tests/e2e/`
- Files: `*.spec.ts` files
- Configuration: `playwright.config.ts`

---

## Project Setup

### Prerequisites

- Node.js 20.19.0 or >=22.12.0
- Playwright already installed as a dev dependency

### Installed Packages

```json
{
  "@playwright/test": "^1.61.0"
}
```

### Configuration

**File**: `playwright.config.ts`

Key settings:

- **Test directory**: `./tests/e2e`
- **Base URL**: `http://127.0.0.1:5173`
- **Browser**: Chromium
- **Reporter**: HTML
- **Web Server**: Automatically starts Vite dev server on port 5173

---

## Creating Tests

### Basic Test Structure

```typescript
import playwright from '@playwright/test'

const { test, expect } = playwright

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Arrange: Set up test state
    await page.goto('/path')

    // Act: Perform user actions
    await page.getByRole('button', { name: 'Click Me' }).click()

    // Assert: Verify results
    await expect(page.getByText('Success')).toBeVisible()
  })
})
```

### Working with Authentication

Use the `setupApiMocks` helper to set up authenticated or unauthenticated sessions:

```typescript
import { setupApiMocks, setAuthCookies } from './helpers/mockApi'

test('authenticated user flow', async ({ page }) => {
  // Option 1: Mock API responses with authentication state
  await setupApiMocks(page, { authenticated: true, role: 'admin' })

  // Option 2: Set cookies directly
  await setAuthCookies(page, 'admin')

  await page.goto('/mpa')
  await expect(page.getByRole('heading', { name: 'MPA Records' })).toBeVisible()
})

test('unauthenticated user sees login', async ({ page }) => {
  // Mock without authentication
  await setupApiMocks(page, { authenticated: false })

  await page.goto('/mpa')
  await expect(page.getByText('Log In')).toBeVisible()
})
```

#### Available Roles

- `'admin'` - Full access, can see Users navigation
- `'reviewer'` - Limited access, cannot see Users navigation
- `'guest'` - Not authenticated

### User Interaction Patterns

#### Locating Elements

```typescript
// By role (preferred - most reliable)
await page.getByRole('button', { name: 'Submit' }).click()
await page.getByRole('heading', { name: 'Page Title' })
await page.getByLabel('Username')

// By text
await page.getByText('Welcome Back')

// By placeholder
await page.getByPlaceholder('Enter email')

// By CSS selector (last resort)
await page.locator('input#password').fill('secret')
```

#### Form Interactions

```typescript
// Fill input
await page.getByLabel('Email').fill('user@example.com')

// Select from dropdown
await page.getByLabel('Province').selectOption('Cebu')

// Check checkbox
await page.getByLabel('Agree to terms').check()

// Upload file
await page.getByLabel('Shapefile').setInputFiles('path/to/file.shp')
```

#### Navigation and Waiting

```typescript
// Navigate to page
await page.goto('/users')

// Wait for URL to match
await expect(page).toHaveURL(/\/users$/)

// Wait for element to be visible
await expect(page.getByText('Loading...')).toBeVisible({ timeout: 5000 })

// Wait for network idle
await page.waitForLoadState('networkidle')

// Reload page
await page.reload()
```

---

## API Mocking

The project includes a comprehensive API mock helper in `tests/e2e/helpers/mockApi.ts`.

### Mock Data Available

The helper provides mock responses for:

- **Authentication**: Login endpoint, user info (`/me`)
- **Users**: List users, get user by ID
- **MPA Data**: Approved records, pending records, single record details
- **Ordinances**: List ordinances for an MPA
- **Location Data**: Provinces, municipalities, barangays
- **Upload Operations**: Approve/reject MPA submissions, upload shapefile

### Adding Custom Mocks

Extend `setupApiMocks` in `helpers/mockApi.ts`:

```typescript
// Inside the route handler function
if (pathname.endsWith('/custom-endpoint') && method === 'POST') {
  await json(200, {
    success: true,
    data: {
      /* your mock data */
    },
  })
  return
}
```

---

## Common Test Scenarios

### Login Flow

```typescript
test('user can log in', async ({ page }) => {
  await setupApiMocks(page, { authenticated: false })

  await page.goto('/mpa')
  await page.getByText('Log In').click()

  await expect(page.getByText('Welcome Back')).toBeVisible()
  await page.getByLabel('Username').fill('ada')
  await page.locator('input#password').fill('secret')
  await page.getByRole('button', { name: 'Sign In' }).click()

  await expect(page.getByText('Signed in successfully')).toBeVisible()
})
```

### List and Filter

```typescript
test('displays and filters MPA records', async ({ page }) => {
  await setupApiMocks(page, { authenticated: true, role: 'admin' })

  await page.goto('/mpa')
  await expect(page.getByText('Apo Reef MPA')).toBeVisible()

  // Filter by province
  await page.getByLabel('Province').selectOption('Bohol')
  await expect(page.getByText('Balicasag MPA')).toBeVisible()
})
```

### Create Record

```typescript
test('creates new MPA record', async ({ page }) => {
  await setupApiMocks(page, { authenticated: true, role: 'admin' })

  await page.goto('/mpa')
  await page.getByRole('button', { name: 'Create' }).click()

  await page.getByLabel('Name').fill('New MPA')
  await page.getByLabel('Province').selectOption('Cebu')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('Created successfully')).toBeVisible()
})
```

### Permission-Based UI

```typescript
test('reviewer cannot access admin features', async ({ page }) => {
  await setupApiMocks(page, { authenticated: true, role: 'reviewer' })

  await page.goto('/mpa')
  await expect(page.getByRole('button', { name: 'Users' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Create' })).not.toBeVisible()
})
```

---

## Assertions

Common Playwright assertions:

```typescript
// Visibility
await expect(element).toBeVisible()
await expect(element).toBeHidden()

// Text content
await expect(element).toContainText('Hello')
await expect(element).toHaveText('Exact text')

// Value
await expect(input).toHaveValue('text')

// URL
await expect(page).toHaveURL('http://localhost:5173/users')
await expect(page).toHaveURL(/\/users$/)

// Count
await expect(page.getByRole('row')).toHaveCount(5)

// Disabled/Enabled
await expect(button).toBeDisabled()
await expect(button).toBeEnabled()

// Class
await expect(element).toHaveClass('active')
```

---

## Running Tests

### Commands

| Command                     | Purpose                                             |
| --------------------------- | --------------------------------------------------- |
| `npm run test:e2e`          | Run all tests                                       |
| `npm run test:e2e:ui`       | Run tests in interactive UI                         |
| `npm run test:e2e:headed`   | Run tests with visible browser                      |
| `npm run test:e2e:smoke`    | Run critical path tests (auth, MPA list/create)     |
| `npm run test:e2e:full:ci`  | Run all tests in CI mode (single worker, 2 retries) |
| `npm run test:e2e:smoke:ci` | Run smoke tests in CI mode                          |

### Run Specific Test

```bash
# By filename
npx playwright test tests/e2e/auth-navigation.spec.ts

# By test name pattern
npx playwright test -g "login"

# By line number
npx playwright test tests/e2e/auth-navigation.spec.ts:7
```

### Run in Different Modes

```bash
# Interactive debug mode (slowest, best for debugging)
npx playwright test --debug

# UI mode (good for development)
npx playwright test --ui

# Headed mode (see the browser)
npx playwright test --headed

# Parallel mode (default, fast)
npx playwright test

# Serial mode (one at a time)
npx playwright test --workers=1
```

---

## Debugging

### UI Mode (Recommended)

```bash
npm run test:e2e:ui
```

The UI shows:

- Test execution with step-by-step progression
- Ability to step through tests
- Time travel debugging
- Browser preview

### Debug Mode

```bash
npx playwright test --debug
```

Starts the Playwright Inspector where you can:

- Step through code line by line
- Evaluate expressions in console
- View DOM at each step

### Screenshots and Traces

Traces are automatically captured on first retry. View them:

```bash
npx playwright show-trace trace.zip
```

### Console Logging

```typescript
test('debug output', async ({ page }) => {
  console.log('Starting test')
  await page.goto('/mpa')

  const heading = page.getByRole('heading')
  console.log('Heading text:', await heading.textContent())

  page.on('console', (msg) => console.log(msg.text()))
})
```

### Pause Test Execution

```typescript
test('with pause', async ({ page }) => {
  await page.goto('/mpa')
  await page.pause() // Debugger will pause here
  // Continue execution manually
})
```

---

## Best Practices

### 1. Use Semantic Locators

```typescript
// ✅ Good - semantic, accessible
await page.getByRole('button', { name: 'Submit' })
await page.getByLabel('Email')

// ❌ Avoid - brittle, internal details
await page.locator('div.form > input[type="email"]')
```

### 2. Wait for Readiness

```typescript
// ✅ Good - explicit wait
await expect(page.getByText('Data loaded')).toBeVisible({ timeout: 5000 })

// ❌ Avoid - arbitrary sleep
await page.waitForTimeout(1000)
```

### 3. Test User Behavior

```typescript
// ✅ Good - tests actual user interactions
await page.getByLabel('Username').fill('user')
await page.getByRole('button', { name: 'Sign In' }).click()

// ❌ Avoid - implementation details
await page.evaluate(() => {
  window.dispatch({ type: 'LOGIN', payload: 'user' })
})
```

### 4. Keep Tests Independent

```typescript
// ✅ Good - each test sets up its own state
test('test A', async ({ page }) => {
  await setupApiMocks(page, { authenticated: true })
  // ...
})

test('test B', async ({ page }) => {
  await setupApiMocks(page, { authenticated: true })
  // ...
})
```

### 5. Organize by Feature

```typescript
// ✅ Good structure
test.describe('MPA List', () => {
  test('displays list', async ({ page }) => {
    /* ... */
  })
  test('filters by province', async ({ page }) => {
    /* ... */
  })
  test('creates new record', async ({ page }) => {
    /* ... */
  })
})
```

### 6. Use Page Object Pattern for Complex Flows

```typescript
class LoginPage {
  constructor(private page: Page) {}

  async login(username: string, password: string) {
    await this.page.getByLabel('Username').fill(username)
    await this.page.getByLabel('Password').fill(password)
    await this.page.getByRole('button', { name: 'Sign In' }).click()
  }

  async isLoggedIn() {
    return this.page.getByRole('button', { name: 'User Profile' }).isVisible()
  }
}

test('login flow', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.login('ada', 'secret')
  expect(await loginPage.isLoggedIn()).toBe(true)
})
```

---

## CI/CD Integration

Tests run automatically in CI with these settings:

- **Workers**: 1 (serial execution)
- **Retries**: 2 (failed tests retry twice)
- **Reporter**: HTML report generated

View HTML report:

```bash
npx playwright show-report
```

---

## File Organization

```
tests/
├── e2e/
│   ├── auth-navigation.spec.ts
│   ├── mpa-list-create.spec.ts
│   ├── mpa-details-pending.spec.ts
│   ├── users-list-create.spec.ts
│   ├── users-edit.spec.ts
│   ├── users-details.spec.ts
│   ├── mpa-pending-list-context-menu.spec.ts
│   └── helpers/
│       └── mockApi.ts
playwright.config.ts
```

---

## Troubleshooting

### Tests Timeout

- Increase timeout in test: `await expect(element).toBeVisible({ timeout: 10000 });`
- Increase in config: `use: { navigationTimeout: 30000 }`
- Check if dev server is running: `npm run dev`

### Elements Not Found

- Use UI mode to inspect: `npm run test:e2e:ui`
- Log element search: `console.log(await page.locator('selector').all());`
- Check if page navigated correctly: `console.log(page.url());`

### Tests Fail in CI but Pass Locally

- CI uses single worker: `npx playwright test --workers=1`
- CI retries failed tests: Run with `--retries=2`
- Check browser compatibility in CI

### Mock API Not Working

- Ensure `setupApiMocks` is called before navigation
- Check request URL matches mock route
- Verify mock response format matches API contract

### Performance Issues

- Run tests in parallel (default): `npm run test:e2e`
- Use `--workers=4` for more parallelism
- Profile slow tests: Add timestamps in test logs

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)

---

## Example Test Files

See existing tests for patterns:

- `tests/e2e/auth-navigation.spec.ts` - Authentication flows
- `tests/e2e/mpa-list-create.spec.ts` - List and create operations
- `tests/e2e/users-list-create.spec.ts` - User management
