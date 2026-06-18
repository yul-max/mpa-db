# MPA Components

## Purpose

Feature components for the Marine Protected Area (MPA) workflow: listing, detail view, creation forms, and an interactive map dashboard with drawers and filters.

## Location

- `src/components/mpa`
- `src/components/mpa/MapComponents`

## Main Components

### `AddMPAForm.vue`

- Modal form for creating MPAs with a tabbed layout (Basic Information, More Info).
- Handles shapefile upload, metadata assembly, and dynamic ordinance entry rows with add/remove.
- Emits: `submit`, `close`.
- Exposes: `open()`, `close()`.
- Store dependencies: `useOptionsStore()`, `useAuthStore()`, `useUsersStore()`.
- API calls: `uploadShapefile()` from `@/api/mpa`.
- Composables: `useForm`, `useProvinceOptions`, `useMunicipalityOptions`, `useBarangayOptions`.
- Key internals: `isOpen`, `activeTab`, `payload`, `errors`, `ordinanceEntries`, `isFormValid` (computed), `isDirty` (computed), `isAdmin` (computed).

### `MapDashboard.vue`

- Map-centric dashboard built on Leaflet with marker clustering, WMS layers, and interactive feature queries.
- Coordinates drawer/modal state via stores and renders child map components.
- Store dependencies: `useDrawerStore()`, `usePointsStore()`.
- API calls: `getDetailedMapData()`, `getGeoserverData()`.
- Leaflet plugins: `markercluster`, `edgebuffer`, `search`, `easybutton`.
- Key internals: `mapElement` (ref), `map` (Leaflet instance), `wmsLayer`, `detailedDataLayer`, `currentCqlFilter`, `filterModalOpen`, `loading` (computed from store).

### `MPADetails.vue`

- Details screen for approved and pending MPAs using the shared `Details` component.
- Supports tabbed layout (Basic Info, History, Management, Monitoring), inline editing, ordinance history, MEAT scores, and file preview.
- Pending MPAs expose approve/reject actions with confirmation modals.
- Store dependencies: `useMPAStore()`, `useOptionsStore()`, `useUsersStore()`, `useAuthStore()`.
- API calls: `updateMPA()`, `fetchOrdinances()`, `approvePendingMPA()`, `rejectPendingMPA()`.
- Composables: `useProvinceOptions`, `useMunicipalityOptions`, `useBarangayOptions`, `useForm`, `useRoute`, `useRouter`.
- Key internals: `currentData` (computed), `isPending` (computed), `canEdit` (computed), `isEditing`, `editPayload`, `ordinances`, `meatScores`, `pendingActionItems` (computed).

### `MPAForm.vue`

- Lightweight form shell for route-driven MPA create/edit scenarios.
- Wraps the shared `Form` component with an MPA-specific Zod schema and field config.
- Composables: `useForm`, `useRoute`, `useRouter`.
- Key internals: `isEdit` (computed), `mpaSchema` (Zod), `initialValues`, `fields`.

### `MPAList.vue`

- Primary listing view for MPAs with three view modes: Approved, Pending, and My MPAs.
- Uses `GenericDataTable` with dynamic column sets, sorting, filtering, pagination, CSV export, and row context menus.
- Supports inline approve/reject actions for pending MPAs.
- Store dependencies: `useOptionsStore()`, `useAuthStore()`, `useMPAStore()`.
- API calls: `fetchMPADatalist()`, `fetchMyMPAs()`, `approvePendingMPA()`, `rejectPendingMPA()`.
- Composables: `useProvinceOptions`, `useRouter`.
- Key internals: `mpas`, `loading`, `currentPage`, `rows`, `totalRecords`, `sortField`, `sortOrder`, `showPendingMPAs`, `showMyMPAs`, `tableColumns` (computed), `isAdmin` (computed), `canViewMyMPAs` (computed).

## Map Subcomponents

### `FilterModal.vue`

- Modal for map filter controls (MPA checkbox, NIPAS status, ecosystem type, year range).
- Emits: `close`, `apply`.
- Key internals: `form` ref with fields `mpa`, `nipas`, `ecosystem`, `mpaMinYear`, `mpaMaxYear`.

### `MpaDrawer.vue`

- Right-side drawer displaying selected MPA context from map interactions.
- Renders sections: Basic Information, Location, Area, Dates, Status.
- Store dependencies: `useDrawerStore()` (reads `store.mpa.isOpen` and MPA data).

### `PinDrawer.vue`

- Drawer displaying raw properties of a selected map pin/point.
- Store dependencies: `useDrawerStore()` (reads `store.pin.isOpen` and `store.pin.properties`).

## Data and Events

| Component | Emits | Exposed Methods |
|-----------|-------|-----------------|
| `AddMPAForm` | `submit`, `close` | `open()`, `close()` |
| `MapDashboard` | — | — |
| `MPADetails` | — | — |
| `MPAForm` | (delegates to `Form`) | — |
| `MPAList` | — | — |
| `FilterModal` | `close`, `apply` | — |
| `MpaDrawer` | — | — |
| `PinDrawer` | — | — |

### Store and API Dependencies

| Store | Used By |
|-------|---------|
| `useOptionsStore()` | `AddMPAForm`, `MPADetails`, `MPAList` |
| `useAuthStore()` | `AddMPAForm`, `MPADetails`, `MPAList` |
| `useUsersStore()` | `AddMPAForm`, `MPADetails` |
| `useMPAStore()` | `MPADetails`, `MPAList` |
| `useDrawerStore()` | `MapDashboard`, `MpaDrawer`, `PinDrawer` |
| `usePointsStore()` | `MapDashboard` |

| API Function | Used By |
|--------------|---------|
| `uploadShapefile()` | `AddMPAForm` |
| `fetchMPADatalist()` | `MPAList` |
| `fetchMyMPAs()` | `MPAList` |
| `updateMPA()` | `MPADetails` |
| `fetchOrdinances()` | `MPADetails` |
| `approvePendingMPA()` | `MPADetails`, `MPAList` |
| `rejectPendingMPA()` | `MPADetails`, `MPAList` |
| `getDetailedMapData()` | `MapDashboard` |
| `getGeoserverData()` | `MapDashboard` |

## Integration Notes

- Keep list/details/form behavior consistent with shared UI abstractions (`GenericDataTable`, `Details`, `Form`).
- Prefer extending shared table/details behavior before introducing MPA-only duplicates.
- Province → municipality → barangay cascading dropdown pattern is shared across `AddMPAForm`, `MPADetails`, and `SignupForm`.
- `MapDashboard` uses imperative Leaflet code and manages its own lifecycle; it does not use Vue reactivity for map state.
- `MPAList` renders `AddMPAForm` as a child modal opened via exposed `open()` method.

## Testing Notes

- Validate list view switching (Approved, Pending, My MPAs) and that columns update per mode.
- Validate create form tab navigation, ordinance row add/remove, and shapefile upload.
- Validate details edit mode save/cancel with dirty-state confirmation.
- Validate approve/reject flows including confirmation modals and rejection reason input.
- Validate map marker clustering, WMS layer loading, and drawer open/close from map clicks.
- Validate filter modal apply/reset updates the WMS CQL filter.

## Change Checklist

- Keep behavior aligned with shared UI patterns (`GenericDataTable`, `Details`, `Form`).
- Update cascading dropdown composables if province/municipality/barangay data shape changes.
- Update linked docs pages when MPA contracts change.
- Add or adjust tests for user-visible behavior changes.
