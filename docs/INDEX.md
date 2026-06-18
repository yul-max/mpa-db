# Documentation Index & Common Workflows

## Quick Reference by Task

### I want to...

#### Add a new feature

1. Read: [Development Guide - Adding a New Feature](DEVELOPMENT_GUIDE.md#adding-a-new-feature)
2. Follow: Step-by-step guide for store, API, components, and routes

#### Work with API data

1. Read: [API Layer Documentation](API_LAYER.md)
2. Reference: How to create endpoint modules and handle authentication

#### Build a form

1. Read: [Form System Documentation](FORM_SYSTEM.md)
2. Reference: [Composables - useForm](COMPOSABLES.md#useform)
3. Example: Schema-driven form patterns

#### Manage application state

1. Read: [State Management Documentation](STATE_MANAGEMENT.md)
2. Reference: How stores work and patterns for different operations

#### Handle user authentication

1. Reference: [State Management - Auth Store](STATE_MANAGEMENT.md#auth-store-srcstoresauthts)
2. Related: [API Layer - Token Refresh](API_LAYER.md#response-interceptor--token-refresh)

#### Navigate between pages

1. Read: [Routing & Navigation](ROUTING.md)
2. Reference: Route names, guards, and programmatic navigation

#### Reuse logic across components

1. Read: [Composables Documentation](COMPOSABLES.md)
2. Resource: [Utilities & Helpers](UTILITIES.md)

#### Understand component structure

1. Read: [Component Architecture](COMPONENTS.md)
2. Details: [Component Documentation Index](components/README.md)

#### Format data for display

1. Reference: [Utilities - Formatters](UTILITIES.md#formatters-srcutilsformattersts)

#### Check user permissions

1. Reference: [Composables - useCan](COMPOSABLES.md#usecan)

#### Load options for dropdowns

1. Reference: [Composables - useDropdownOptions](COMPOSABLES.md#usedropdownoptions)

---

## Documentation by System

### User Interface

- [Components Documentation](COMPONENTS.md) - Architecture and composition patterns
- [Component Details](components/README.md) - Individual component docs
  - [Auth Components](components/auth.md)
  - [MPA Components](components/mpa.md)
  - [User Components](components/users.md)
  - [UI Components](components/ui.md)
- [Form System](FORM_SYSTEM.md) - Forms, validation, fields
- [Routing](ROUTING.md) - Page navigation and route configuration

### Data Management

- [API Layer](API_LAYER.md) - HTTP communication and API endpoints
- [State Management](STATE_MANAGEMENT.md) - Pinia stores
  - [Auth Store](STATE_MANAGEMENT.md#auth-store-srcstoresauthts)
  - [MPA Store](STATE_MANAGEMENT.md#mpa-store-srcstoresmpath)
  - [Users Store](STATE_MANAGEMENT.md#users-store-srcstoresusersts)
  - [Options Store](STATE_MANAGEMENT.md#options-store-srcstoresoptionsts)

### Code Organization

- [Composables](COMPOSABLES.md) - Reusable logic functions
- [Utilities](UTILITIES.md) - Helper functions and formatters
- [Development Guide](DEVELOPMENT_GUIDE.md) - Project structure and workflows

---

## Common Workflows

### Workflow 1: Display a List of Items

**Overview**: Fetch data from API and display in a table with pagination and filters.

**Steps**:

1. **Create Store** (`src/stores/myFeature.ts`)
   - Reference: [State Management - Creating a New Store](STATE_MANAGEMENT.md#creating-a-new-store)
   - Add `list` ref for items
   - Add `fetchAll()` action

2. **Create API Module** (`src/api/myFeature.ts`)
   - Reference: [API Layer - Adding New Endpoints](API_LAYER.md#adding-new-endpoints)
   - Export `fetchMyFeatures()` function

3. **Create List Component** (`src/components/myFeature/MyFeatureList.vue`)
   - Reference: [Components - Practical Composition Patterns](COMPONENTS.md#practical-composition-patterns)
   - Use `GenericDataTable.vue` for UI
   - Call `store.fetchAll()` on mount

4. **Add Routes** (`src/router/index.ts`)
   - Reference: [Routing - Adding New Routes](ROUTING.md#adding-new-routes)
   - Add `/my-feature` route for list

**Related Docs**: [COMPONENTS.md](COMPONENTS.md), [API_LAYER.md](API_LAYER.md), [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)

---

### Workflow 2: Build a Form with Validation

**Overview**: Create a form with validated inputs and error handling.

**Steps**:

1. **Define Schema** (`src/form/myFeatureRules.ts`)
   - Reference: [Form System - Validation Rules](FORM_SYSTEM.md#2-validation-rules-srcformrulests)
   - Use Zod for type-safe validation

2. **Create Field Config**
   - Reference: [Form System - Field Types](FORM_SYSTEM.md#1-field-types-srcformfieldsts)
   - Define fields with labels, types, validation rules

3. **Use useForm Composable**
   - Reference: [Composables - useForm](COMPOSABLES.md#useform)
   - Get form state with validation

4. **Render Form Component**
   - Reference: [Form System - Form Component](FORM_SYSTEM.md#form-component-srccomponentsui-formvue)
   - Use `Form.vue` or build custom with field components

5. **Handle Submission**
   - Validate with `form.validateForm()`
   - Send data to API via store
   - Handle errors

**Related Docs**: [FORM_SYSTEM.md](FORM_SYSTEM.md), [COMPOSABLES.md](COMPOSABLES.md)

---

### Workflow 3: Add Permission-Based UI

**Overview**: Show/hide elements based on user permissions.

**Steps**:

1. **Check Permission** (in component `<script setup>`)
   - Reference: [Composables - useCan](COMPOSABLES.md#usecan)
   - Use `const canEdit = useCan('edit:feature')`

2. **Conditionally Render**

   ```vue
   <button v-if="canEdit">Edit</button>
   ```

3. **Update Auth Store** (when user role changes)
   - Reference: [State Management - Auth Store](STATE_MANAGEMENT.md#auth-store-srcstoresauthts)
   - User permissions should come from auth response

**Related Docs**: [COMPOSABLES.md](COMPOSABLES.md), [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)

---

### Workflow 4: Handle Cascading Dropdowns

**Overview**: Load dropdown options based on parent field selection.

**Steps**:

1. **Setup Form State**
   - Use `useForm()` composable
   - Reference: [Composables - useForm](COMPOSABLES.md#useform)

2. **Load Parent Options**
   - Reference: [Composables - useDropdownOptions](COMPOSABLES.md#usedropdownoptions)
   - Create ref: `const { options: provinces } = useDropdownOptions(...)`

3. **Load Dependent Options**
   - Use computed URL based on parent selection
   - Reference: [Composables - useDropdownOptions - Dependent Dropdowns](COMPOSABLES.md#dependent-dropdowns)

4. **Reset Child on Parent Change**
   - Watch parent field
   - Clear child field value

**Related Docs**: [COMPOSABLES.md](COMPOSABLES.md), [FORM_SYSTEM.md](FORM_SYSTEM.md)

---

### Workflow 5: Debug Authentication Issues

**Overview**: Troubleshoot token refresh, login, or permission problems.

**Steps**:

1. **Check Token in Auth Store**
   - Reference: [Development Guide - Debugging](DEVELOPMENT_GUIDE.md#debugging)
   - Log: `console.log(useAuthStore().accessToken)`

2. **Verify API Token Injection**
   - Reference: [API Layer - Request Interceptor](API_LAYER.md#request-interceptor)
   - Check Network tab for `Authorization` header

3. **Check Token Refresh Flow**
   - Reference: [API Layer - Response Interceptor](API_LAYER.md#response-interceptor--token-refresh)
   - Look for `/auth/refresh` call if 401 received

4. **Verify Auth Store Login**
   - Reference: [State Management - Auth Store](STATE_MANAGEMENT.md#login)
   - Ensure login saves token and user correctly

5. **Test /me Endpoint**
   - Reference: [State Management - verifyAuth](STATE_MANAGEMENT.md#verifyauth)
   - Should return current user data

**Related Docs**: [API_LAYER.md](API_LAYER.md), [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)

---

### Workflow 6: Create a Multi-Step Form

**Overview**: Build a form that spans multiple screens/steps.

**Steps**:

1. **Define Step Config** (`src/form/steps.ts`)
   - Reference: [Form System - Multi-Step Forms](FORM_SYSTEM.md#multi-step-forms)
   - Array of steps with field names

2. **Create Form with useForm()**
   - Single schema validates all steps
   - Only validate fields in current step

3. **Track Current Step**
   - `const currentStep = ref(0)`
   - `nextStep()` and `previousStep()` functions

4. **Show Step-Specific Fields**
   - Filter fields array by current step
   - Pass to Form component

**Related Docs**: [FORM_SYSTEM.md](FORM_SYSTEM.md), [COMPOSABLES.md](COMPOSABLES.md)

---

### Workflow 7: Handle API Errors

**Overview**: Properly catch and handle API request failures.

**Steps**:

1. **In API Module**
   - Reference: [API Layer - Error Handling](API_LAYER.md#error-handling)
   - Let errors bubble up (don't catch)

2. **In Store**
   - Reference: [State Management - Usage in Components](STATE_MANAGEMENT.md#using-stores-in-components)
   - Catch errors, log for debugging, set state

3. **In Component**
   - Try/catch around store calls
   - Show user-friendly toast messages
   - Reference: [Development Guide - Error Handling](DEVELOPMENT_GUIDE.md#error-handling)

**Related Docs**: [API_LAYER.md](API_LAYER.md), [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)

---

### Workflow 8: Optimize Component Performance

**Overview**: Improve rendering speed and reduce re-renders.

**Steps**:

1. **Use Computed Properties**
   - Reference: [Development Guide - Performance Optimization](DEVELOPMENT_GUIDE.md#performance-optimization)
   - Cache derived data

2. **Lazy Load Heavy Components**
   - Use `defineAsyncComponent()`
   - Reference: [Development Guide - Code Splitting](DEVELOPMENT_GUIDE.md#1-code-splitting)

3. **Proper List Rendering**
   - Reference: [Development Guide - List Rendering](DEVELOPMENT_GUIDE.md#4-list-rendering)
   - Always use `:key` with unique identifier

4. **Debounce Search/Filter**
   - Reference: [Development Guide - Watchers](DEVELOPMENT_GUIDE.md#3-watchers)
   - Reduce API calls

**Related Docs**: [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)

---

## Documentation Structure

```
docs/
├── INDEX.md (this file)           # You are here
├── COMPONENTS.md                  # UI architecture
├── API_LAYER.md                   # HTTP & endpoints
├── STATE_MANAGEMENT.md            # Pinia stores
├── FORM_SYSTEM.md                 # Forms & validation
├── COMPOSABLES.md                 # Reusable functions
├── ROUTING.md                     # Navigation
├── UTILITIES.md                   # Helper functions
├── DEVELOPMENT_GUIDE.md           # How to build features
├── COMPONENTS.md (archive)        # Component overview
└── components/
    ├── README.md                  # Component index
    ├── auth.md                    # Auth components
    ├── mpa.md                     # MPA components
    ├── users.md                   # User components
    └── ui.md                      # Shared UI components
```

---

## How to Use This Documentation

### Starting a New Task

1. **Look up your task** in "I want to..." section above
2. **Read the relevant documentation** - links provided
3. **Follow the example code** - most docs have examples
4. **Reference related docs** - "Related Docs" sections help you understand connections

### Learning the Architecture

**Suggested Reading Order**:

1. Start: [Development Guide](DEVELOPMENT_GUIDE.md)
2. Then: [API Layer](API_LAYER.md) and [State Management](STATE_MANAGEMENT.md)
3. Next: [Form System](FORM_SYSTEM.md) and [Composables](COMPOSABLES.md)
4. Deep Dive: [Components](COMPONENTS.md), [Routing](ROUTING.md), [Utilities](UTILITIES.md)

### Solving a Problem

1. **Check Troubleshooting sections** - end of each doc
2. **Look for "Common Issues"** - in Development Guide
3. **Search related docs** - index at top shows connections
4. **Ask team or create issue** - if not found

---

## Types of Documentation

### Architecture Docs

- [Components](COMPONENTS.md)
- [API Layer](API_LAYER.md)
- [State Management](STATE_MANAGEMENT.md)
- [Routing](ROUTING.md)

**Use When**: Understanding how systems fit together

### System Docs

- [Form System](FORM_SYSTEM.md)
- [Utilities](UTILITIES.md)
- [Composables](COMPOSABLES.md)

**Use When**: Learning how to use specific systems

### Guides

- [Development Guide](DEVELOPMENT_GUIDE.md)
- [This Index](INDEX.md)

**Use When**: Implementing features or learning workflows

### Reference Docs

- [Component Details](components/README.md)

**Use When**: Looking up specific components

---

## Contributing to Documentation

### When to Update Docs

- Feature implementation is complete
- Architecture decision is made
- Pattern is established and proven
- Someone asks the same question twice

### How to Document

1. **File Location**: Put docs in `docs/` folder
2. **Frontmatter**: Add title and sections
3. **Examples**: Include code examples
4. **Reference Links**: Link between related docs
5. **Update Index**: Add to INDEX.md and README.md

### Documentation Standards

- Clear section headings
- Real code examples (not pseudocode)
- Tables for quick reference
- Troubleshooting sections
- "Related docs" at end
- Links between documents

---

## External Resources

### Official Documentation

- [Vue 3](https://vuejs.org/)
- [Vue Router](https://router.vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Zod](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Leaflet](https://leafletjs.com/) (Maps)

### Packages Used

- [axios](https://axios-http.com/) - HTTP client
- [@vueuse/core](https://vueuse.org/) - Vue utilities
- [PrimeVue](https://primevue.org/) - UI components
- [Leaflet](https://leafletjs.com/) - Map library

---

## FAQ

**Q: Where do I find information about a specific component?**  
A: Check [Component Documentation Index](components/README.md) and related pages like [UI Components](components/ui.md)

**Q: How do I add a new API endpoint?**  
A: See [API Layer - Adding New Endpoints](API_LAYER.md#adding-new-endpoints)

**Q: What's the difference between stores and composables?**  
A: See [State Management Overview](STATE_MANAGEMENT.md#overview) and [Composables Overview](COMPOSABLES.md#overview)

**Q: How do I check user permissions?**  
A: Use `useCan()` composable - see [Composables - useCan](COMPOSABLES.md#usecan)

**Q: Where should I put utility functions?**  
A: Create in `src/utils/` and organize by feature - see [Utilities](UTILITIES.md)

**Q: How do forms validate data?**  
A: Forms use Zod schemas - see [Form System - Validation](FORM_SYSTEM.md#2-validation-rules-srcformrulests)

**Q: What's the quickest way to add a new feature?**  
A: Follow [Development Guide - Adding a New Feature](DEVELOPMENT_GUIDE.md#adding-a-new-feature)

---

## Support

- **Questions**: Ask in team chat or create a GitHub issue
- **Bug Reports**: Create issue with details
- **Suggestions**: PR to update documentation
- **Learning**: Start with [Development Guide](DEVELOPMENT_GUIDE.md)
