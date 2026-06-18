# mpa-db

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Documentation

### Getting Started

- [Development Guide](docs/DEVELOPMENT_GUIDE.md) - How to add new features and work with the codebase

### Architecture & Core Systems

- [Component Architecture Overview](docs/COMPONENTS.md) - Component structure and patterns
- [API Layer](docs/API_LAYER.md) - HTTP communication, token refresh, and API endpoints
- [State Management](docs/STATE_MANAGEMENT.md) - Pinia stores and state management
- [Form System](docs/FORM_SYSTEM.md) - Form validation, field types, and form components
- [Composables](docs/COMPOSABLES.md) - Reusable Vue 3 composition functions
- [Routing](docs/ROUTING.md) - Navigation, route configuration, and guards
- [Utilities](docs/UTILITIES.md) - Helper functions and common utilities

### Component Documentation

- [Component Docs Index](docs/components/README.md)
- [Auth Components](docs/components/auth.md)
- [MPA Components](docs/components/mpa.md)
- [User Components](docs/components/users.md)
- [Shared UI Components](docs/components/ui.md)

### Other

- In-app technical docs page: run `npm run dev` and open `/technical-docs`

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
