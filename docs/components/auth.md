# Auth Components

## Purpose

Authentication UI components that handle login, signup, and logged-in user actions. These components are rendered inside the app header and manage drawer-based auth flows.

## Location

- `src/components/auth`

## Components

### `LoginForm.vue`

- Username/password login form rendered inside the auth drawer.
- Built with the shared `Form` component and Zod schema validation.
- Delegates authentication to `authStore.login(values)`.
- Props: `onSuccess?: () => void | Promise<void>`.
- Emits: `cancel`, `switch-to-signup`.
- Key internals: `loginSchema` (Zod), `initialValues` (LoginFormPayload), `fields` (FieldDef[]).

### `LoginModal.vue`

- Drawer container that hosts `LoginForm` and `SignupForm`.
- Switches between auth modes via child-emitted events and resets to login on close.
- Exposes: `openDrawer()`, `closeDrawer()`.
- Key internals: `isOpen` (ref), `currentForm` (ref\<'login' | 'signup'\>), `handleSuccess()` (waits 1.5 s then closes).

### `SignupForm.vue`

- User registration form rendered inside the auth drawer.
- Includes dynamic province/municipality cascading dropdowns and Zod validation.
- After successful signup, auto-logs the user in via `authStore.login()`.
- Props: `onSuccess?: () => void | Promise<void>`.
- Emits: `switch-to-login`, `cancel`.
- Store dependencies: `useAuthStore()`, `useOptionsStore()`.
- API calls: `createUser()` from `@/api/authApi`.
- Composables: `useProvinceOptions`, `useMunicipalityOptions`.
- Key internals: `formRef`, `selectedProvince` (ref), `signupSchema` (Zod), `fieldsConfig` (computed FieldDef[]).
- Lifecycle: `onMounted` → `optionsStore.fetchOptions()`.

### `UserMenu.vue`

- Logged-in user menu for account actions (currently logout only).
- Calls `authStore.logout()`, closes the menu, and navigates to `/mpa`.
- Exposes: `openMenu()`, `closeMenu()`.
- Store dependencies: `useAuthStore()`.
- Router: `useRouter()` for post-logout navigation.

## Data and Events

| Component | Props | Emits | Exposed Methods |
|-----------|-------|-------|-----------------|
| `LoginForm` | `onSuccess?` | `cancel`, `switch-to-signup` | — |
| `LoginModal` | — | — | `openDrawer()`, `closeDrawer()` |
| `SignupForm` | `onSuccess?` | `switch-to-login`, `cancel` | — |
| `UserMenu` | — | — | `openMenu()`, `closeMenu()` |

### Store and API Dependencies

- `useAuthStore()` — used by `LoginForm`, `SignupForm`, `UserMenu` for login/logout actions and user state.
- `useOptionsStore()` — used by `SignupForm` to load province and municipality dropdown data.
- `createUser()` (`@/api/authApi`) — called by `SignupForm` during registration.

## Integration Notes

- Entry points are typically header controls (`AppHeader.vue` opens `LoginModal` and `UserMenu`).
- Auth components should remain UI-focused and delegate business logic to stores and API modules.
- `LoginModal` orchestrates form switching; individual forms emit navigation events rather than managing state directly.
- Province → municipality cascading in `SignupForm` mirrors the pattern used in MPA forms.

## Testing Notes

- Validate login success and error paths (invalid credentials, network failure).
- Validate signup field validation (Zod schema), cascading dropdown behavior, and auto-login after signup.
- Confirm drawer open/close transitions and form-mode reset on close.
- Confirm logout clears auth state and navigates to `/mpa`.

## Change Checklist

- Keep form field definitions aligned with shared `Form` component contracts.
- Update `useOptionsStore` interactions if province/municipality data shape changes.
- Update linked docs pages when auth flow contracts change.
- Add or adjust tests for user-visible behavior changes.
