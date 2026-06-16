# User Components

## Folder

- `src/components/users`

## Components

### `AddUserForm.vue`

- Modal form for creating users.
- Includes dirty-state confirmation on cancellation.

### `UserDetails.vue`

- User details page built on shared details layout.
- Handles account/location data loading and display formatting.

### `UserForm.vue`

- Standalone user form shell used by create/edit routes.

### `UserList.vue`

- User listing view built on shared data table behavior.
- Supports row navigation and CSV export flows.

## Integration Notes

- User list/detail flows should mirror MPA list/detail interaction patterns where possible.
- Route-level pages under `src/pages/Users/*` should remain orchestration layers.
