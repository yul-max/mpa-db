# Shared UI Components

## Purpose

Reusable building blocks that provide consistent layout, interaction, and data-entry patterns across all feature modules. Feature components compose these primitives rather than implementing their own table, form, or details UI.

## Location

- `src/components/ui`
- `src/components/ui/form`
- `src/components/ui/fields`

## Core Primitives

### `Form.vue`

- Schema-driven form renderer. Resolves field components from a type-to-component map and manages validation, touched state, and submit/error lifecycle.
- Props:
  - `schema: z.ZodSchema` — Zod validation schema (required).
  - `initialValues: T` — default form values (required).
  - `fields?: FieldDef[]` — field configuration array.
  - `submitLabel?: string` (default `'Submit'`).
  - `cancelLabel?: string`.
  - `buttonAlign?: 'left' | 'right' | 'center'` (default `'left'`).
  - `buttonFill?: boolean` (default `false`).
  - `submit?: SubmitFunction<T>` — optional async submit callback.
  - `onSuccess?: OnSuccessCallback` — called after successful submit.
  - `clearOnCancel?: boolean` (default `false`).
- Emits: `submit`, `error`, `cancel`, `fieldChange`.
- Exposes: `payload`, `errors`, `isFormValid`, `validateField()`, `validateForm()`, `handleSubmit()`, `clearMessages()`.
- Key internals: `payload` (ref), `errors` (ref), `touched` (ref), `loading` (ref), `successMessage` (ref), `errorMessage` (ref), `componentMap` (maps field type strings to Vue components).

### `GenericDataTable.vue`

- Shared table shell with pagination, sorting, column filters, context menus, CSV export, and row-click navigation.
- Props:
  - `rows: any[]` — table data (required).
  - `columns: ColumnDef[]` — column definitions (required).
  - `totalRecords: number` (required).
  - `loading: boolean` (required).
  - `sortField?: string`.
  - `sortOrder?: number` (default `1`).
  - `pageSize?: number` (default `10`).
  - `exportListName?: 'MPA' | 'User'` (default `'MPA'`).
  - `exportAllRows?: () => Promise<Record<string, unknown>[]>`.
  - `rowContextMenuActions?: (row: any) => ContextAction[]`.
- Emits: `page`, `sort`, `filter-change`, `create`, `row-click`.
- Exposes: `filterValues`.
- Store dependencies: `useAuthStore()` (controls create-button visibility).
- Key internals: `contextMenuOpen`, `contextMenuPosition`, `filtersOpen`, `filterValues`, `activeFilters`, `exportConfirmOpen`, `showCreateButton` (computed), `visibleColumns` (computed).

### `Details.vue`

- Shared details-page layout supporting view/edit mode and optional tabbed sections.
- Props:
  - `data: Record<string, any> | null` (required).
  - `loading?: boolean` (default `false`).
  - `title: string` (required).
  - `subtitle?: string`.
  - `sections: SectionConfig[]` (required).
  - `editFields?: EditFieldDef[]`.
  - `editModel?: Record<string, any> | null`.
  - `backLink?: string`.
  - `backLabel?: string` (default `'Back'`).
  - `editLink?: RouteLocationRaw | null`.
  - `mode?: 'view' | 'edit'` (default `'view'`).
  - `showEdit?: boolean` (default `true`).
  - `editLabel?: string` (default `'Edit'`).
  - `saveLabel?: string` (default `'Save'`).
  - `cancelLabel?: string` (default `'Cancel'`).
  - `disableSave?: boolean` (default `false`).
  - `emptyMessage?: string` (default `'No data found'`).
  - `tabs?: TabConfig[]`.
- Emits: `edit`, `save`, `cancel`.
- Store dependencies: `useAuthStore()` (controls edit-button visibility).
- Key internals: `activeTab` (ref), `activeSections` (computed), `canEdit` (computed), `componentRegistry` (async component map for edit fields), `editFieldMap` (computed).

## Common UI Controls

- `AppHeader.vue`: top-level navigation bar with route buttons, login modal trigger, and user menu. Store: `useAuthStore()`. Key internals: `headerButtons`, `visibleComponents` (computed), `loginModalRef`, `userMenuRef`.
- `Button.vue`: minimal button wrapper forwarding all attributes with default Tailwind styling.
- `ConfirmModal.vue`: reusable confirmation/message modal. Props: `open` (required), `title?`, `message?`, `confirmLabel?`, `cancelLabel?`, `disableConfirm?`. Emits: `confirm`, `cancel`. Provides a content slot for custom body.
- `Dropdown.vue`: reusable trigger/menu dropdown.
- `ContextMenu.vue`: action menu for context interactions (used by `GenericDataTable`).
- `ContextSubMenu.vue`: nested submenu support for `ContextMenu`.
- `FileUpload.vue`: shared file upload control.
- `InputText.vue`: shared text input.
- `Loading.vue`: loading indicator.
- `MapModal.vue`: modal container for map views.
- `PasswordField.vue`: password input with validation hints.
- `SelectBox.vue`: select input abstraction.
- `Switch.vue`: simple toggle switch control.
- `Table.vue`: lower-level table abstraction.
- `UserIcon.vue`: profile/menu trigger icon.

## Dynamic Form Components

### `FormBuilder.vue`

- Builds forms from metadata-driven configurations.

### `MultiStepForm.vue`

- Coordinates multi-step form progression and per-step validation.

## Field Wrappers

All field wrappers share a consistent prop interface: `modelValue`, `label`, `error`, `id` and emit `update:modelValue`.

- `CheckboxField.vue` — boolean toggle field.
- `DropdownField.vue` — select dropdown with options array.
- `FileUploadField.vue` — file picker field.
- `InputTextField.vue` — text/number input with validation display.
- `PasswordTextField.vue` — password input with validation display.
- `SwitchField.vue` — toggle switch field.
- `index.ts` — barrel exports for all field wrappers.
- `MIGRATION_GUIDE.md` and `README.md` — field-system documentation and migration notes.

## Data and Events

### Core Component Contracts

| Component | Props | Emits | Exposed |
|-----------|-------|-------|---------|
| `Form` | 9 props | `submit`, `error`, `cancel`, `fieldChange` | `payload`, `errors`, `isFormValid`, `validateField`, `validateForm`, `handleSubmit`, `clearMessages` |
| `GenericDataTable` | 9 props | `page`, `sort`, `filter-change`, `create`, `row-click` | `filterValues` |
| `Details` | 16 props | `edit`, `save`, `cancel` | — |
| `ConfirmModal` | 6 props | `confirm`, `cancel` | — |
| `AppHeader` | — | — | — |
| `Button` | — (forwards attrs) | — | — |

### Store Dependencies

- `useAuthStore()` — used by `GenericDataTable` (create-button visibility), `Details` (edit-button visibility), `AppHeader` (login state and nav guards).

## Integration Notes

- Reuse these components before adding feature-specific one-off controls.
- Keep field usage aligned with the wrappers under `ui/fields` for consistency.
- `Form` resolves field components via an internal `componentMap`; add new field types there when extending the form system.
- `GenericDataTable` column definitions use `ColumnDef` from `@/types/ui`; `exportValue` and `render` functions on columns control CSV export and cell rendering.
- `Details` supports async component resolution for edit-mode field inputs via `componentRegistry`.

## Testing Notes

- Validate `Form` schema validation, submit lifecycle, error display, and `fieldChange` emission.
- Validate `GenericDataTable` pagination, sorting, column filter toggle, CSV export filename validation, and context menu rendering.
- Validate `Details` tab switching, edit/save/cancel flow, and `canEdit` authorization.
- Validate `ConfirmModal` open/close, confirm/cancel event emission, and disabled confirm state.
- Validate field wrappers emit `update:modelValue` correctly and display error messages.

## Change Checklist

- Keep behavior aligned with shared UI patterns; feature components depend on these contracts.
- Update `componentMap` in `Form.vue` when adding new field types.
- Update `ColumnDef` / `SectionConfig` / `EditFieldDef` types when extending table or details contracts.
- Update linked docs pages when contracts change.
- Add or adjust tests for user-visible behavior changes.
