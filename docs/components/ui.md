# Shared UI Components

## Folders

- `src/components/ui`
- `src/components/ui/form`
- `src/components/ui/fields`

## Core Primitives

### `Form.vue`

- Schema-driven form renderer.
- Uses config-defined field maps and emits submit/error/cancel/field-change events.

### `GenericDataTable.vue`

- Shared table shell with pagination, sort/filter, context menu, and export support.
- Emits list interaction events including row-click.

### `Details.vue`

- Shared details-page layout for view/edit and tabbed section rendering.
- Exposes action slots for feature-specific controls.

## Common UI Controls

- `AppHeader.vue`: top-level navigation and auth controls.
- `Button.vue`: base button wrapper.
- `ConfirmModal.vue`: reusable confirmation/message modal.
- `Dropdown.vue`: reusable trigger/menu dropdown.
- `ContextMenu.vue`: action menu for context interactions.
- `ContextSubMenu.vue`: nested menu support.
- `FileUpload.vue`: shared file upload control.
- `InputText.vue`: shared text input.
- `Loading.vue`: loading indicator.
- `MapModal.vue`: modal container for map views.
- `PasswordField.vue`: password input with validation hints.
- `SelectBox.vue`: select input abstraction.
- `Switch.vue`: simple switch control.
- `Table.vue`: lower-level table abstraction.
- `UserIcon.vue`: profile/menu trigger icon.

## Dynamic Form Components

### `FormBuilder.vue`

- Builds forms from metadata-driven configurations.

### `MultiStepForm.vue`

- Coordinates multi-step progression and validation.

## Field Wrappers

- `CheckboxField.vue`
- `DropdownField.vue`
- `FileUploadField.vue`
- `InputTextField.vue`
- `PasswordTextField.vue`
- `SwitchField.vue`
- `index.ts` (barrel exports)
- `MIGRATION_GUIDE.md` and `README.md` (field-system docs)

## Integration Notes

- Reuse these components before adding feature-specific one-off controls.
- Keep field usage aligned with the wrappers under `ui/fields` for consistency.
