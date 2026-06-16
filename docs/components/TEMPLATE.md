# Component Documentation Template

Use this template when adding a new documentation page under `docs/components`.

## Purpose

- Briefly describe what this component (or component group) is responsible for.

## Location

- Primary path(s) in `src/components/**`.

## Components

### `ComponentName.vue`

- What it renders.
- Which events/props are most important.
- What state/store/api dependencies it has.
- How it is typically composed by pages or parent components.

## Data and Events

- Inputs: props and key dependencies.
- Outputs: emitted events and side effects.
- Important internal state or computed behavior.

## Integration Notes

- Routing expectations.
- Store/API interactions.
- Reusable UI primitives used (`Form`, `Details`, `GenericDataTable`, etc.).

## Testing Notes

- Critical paths to validate with E2E/component tests.
- Known edge cases and regression risks.

## Change Checklist

- Keep behavior aligned with shared UI patterns.
- Update linked docs pages when contracts change.
- Add/adjust tests for user-visible behavior changes.
