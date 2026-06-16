# MPA Components

## Folder

- `src/components/mpa`
- `src/components/mpa/MapComponents`

## Main Components

### `AddMPAForm.vue`

- Modal form used to create MPAs.
- Handles upload + metadata payload assembly.
- Supports dynamic ordinance rows with add/remove and validation.

### `MapDashboard.vue`

- Map-centric dashboard composition for MPA workflows.
- Coordinates layers, interactions, and drawer/modal state.

### `MPADetails.vue`

- Details screen for approved and pending MPAs.
- Uses shared details layout with tabs and action slots.
- Supports pending review actions and ordinance link presentation.

### `MPAForm.vue`

- Reusable MPA form shell for route-driven form scenarios.

### `MPAList.vue`

- Primary listing view for MPAs.
- Uses shared data table behavior for sorting, filtering, export, and actions.

## Map Subcomponents

### `FilterModal.vue`

- Modal for map filter controls.

### `MpaDrawer.vue`

- Drawer used for selected MPA context from map interactions.

### `PinDrawer.vue`

- Drawer used for map pin/point context.

## Integration Notes

- Keep list/details/form behavior consistent with shared UI abstractions.
- Prefer extending shared table/details behavior before introducing MPA-only duplicates.
