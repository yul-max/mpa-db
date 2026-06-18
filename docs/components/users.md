# User Components

## Purpose

User management UI components for listing, viewing, and creating user accounts. These components follow the same list → details pattern used by MPA components.

## Location

- `src/components/users`

## Components

### `AddUserForm.vue`

- Modal form for creating users with sections for Account Info, Location, and Account Type.
- Includes dirty-state confirmation on cancelation via `ConfirmModal`.
- Emits: `submit`, `close`.
- Exposes: `open()`, `close()`.
- Composables: `useForm` (manages `payload`, `errors`, `isFormValid`, `isSubmitting`).
- Key internals: `isOpen` (ref), `confirmOpen` (ref), `isDirty` (computed).

### `UserDetails.vue`

- User details page built on the shared `Details` component.
- Displays sections: Account Information, Location, Account Type.
- API calls: `fetchUser()` from `@/api/users`.
- Key internals: `userData` (ref), `loading` (ref), `editLinkRoute` (computed), `detailsTitle` (computed), `detailsSubtitle` (computed), `userDetailsSections` (static SectionConfig[]).
- Lifecycle: `onMounted` → fetches user data.

### `UserForm.vue`

- Standalone user form shell for route-driven create/edit scenarios.
- Wraps the shared `Form` component with a user-specific Zod schema and field config.
- Key internals: `userSchema` (Zod), `initialValues` (reactive), `fields` (FieldDef[]), `isEdit` (computed from route name).
- Lifecycle: `onMounted` → logs edit mode status.

### `UserList.vue`

- User listing view built on `GenericDataTable` with pagination and CSV export.
- Renders `AddUserForm` as a child modal opened via exposed `open()` method.
- API calls: `fetchUsers()` from `@/api/users`.
- Key internals: `users` (ref), `loading` (ref), `currentPage`, `rowsPerPage`, `totalRecords`, `addUserFormRef`, `tableColumns` (ColumnDef[] with `exportValue` and `render` functions).
- Lifecycle: `onMounted` → `fetchData()`.

## Data and Events

| Component | Emits | Exposed Methods |
|-----------|-------|-----------------|
| `AddUserForm` | `submit`, `close` | `open()`, `close()` |
| `UserDetails` | — | — |
| `UserForm` | — | — |
| `UserList` | — | — |

### Store and API Dependencies

- No direct store usage in user components (auth checks are handled by parent pages or the shared `Details`/`GenericDataTable` components).
- `fetchUser()` (`@/api/users`) — called by `UserDetails` to load a single user.
- `fetchUsers()` (`@/api/users`) — called by `UserList` for paginated listing and export.

## Integration Notes

- User list/detail flows mirror MPA list/detail interaction patterns.
- Route-level pages under `src/pages/Users/*` should remain orchestration layers; keep business logic out of page components.
- `AddUserForm` follows the same modal-with-expose pattern as `AddMPAForm`.
- `UserDetails` and `UserList` consume `Details` and `GenericDataTable` shared components respectively.

## Testing Notes

- Validate user list pagination, row click navigation, and CSV export.
- Validate create form field validation (Zod schema) and dirty-state discard confirmation.
- Validate details page data loading, section rendering, and empty/error states.
- Confirm edit link route computation based on user data.

## Change Checklist

- Keep behavior aligned with shared UI patterns (`GenericDataTable`, `Details`, `Form`).
- Mirror structural changes made to MPA list/detail flows when applicable.
- Update linked docs pages when user contracts change.
- Add or adjust tests for user-visible behavior changes.
