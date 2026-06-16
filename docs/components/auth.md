# Auth Components

## Folder

- `src/components/auth`

## Components

### `LoginForm.vue`

- Username/password login form used in auth drawer flow.
- Built with shared form primitives and auth store actions.
- Emits mode-switch and cancel events for modal orchestration.

### `LoginModal.vue`

- Drawer container that hosts login and signup forms.
- Switches between auth modes and exposes open/close methods.

### `SignupForm.vue`

- User registration form used by the auth drawer.
- Includes password-specific UX and validation behavior.

### `UserMenu.vue`

- Logged-in user menu for account actions.
- Provides logout action and post-logout navigation behavior.

## Integration Notes

- Entry points are typically header controls and route-level auth guards.
- Auth components should remain UI-focused and delegate business logic to stores/apis.
