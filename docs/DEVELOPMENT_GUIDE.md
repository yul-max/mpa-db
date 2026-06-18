# Development Guide

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Basic Vue 3 and TypeScript knowledge

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run type-check

# Run linter
npm run lint

# Build for production
npm run build
```

### Project Structure

```
src/
├── api/              # API endpoint modules
├── assets/           # Static assets
├── components/       # Vue components
│   ├── auth/         # Auth UI components
│   ├── mpa/          # MPA feature components
│   ├── users/        # User management components
│   └── ui/           # Shared UI primitives
├── composables/      # Vue Composition API functions
├── config/           # Configuration files
├── form/             # Form system (validation, fields)
├── layouts/          # Page layout components
├── pages/            # Page components (routes)
├── plugins/          # Vue plugins
├── router/           # Vue Router configuration
├── stores/           # Pinia state stores
├── styles/           # Global styles
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── main.ts           # Application entry point
```

## Adding a New Feature

### 1. Create the Feature Store

Create `src/stores/myFeature.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchMyFeature } from '@/api/myFeature'

export const useMyFeatureStore = defineStore('my-feature', () => {
  const data = ref(null)
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      const response = await fetchMyFeature()
      data.value = response.data
    } finally {
      loading.value = false
    }
  }

  return { data, loading, load }
})
```

### 2. Create the API Module

Create `src/api/myFeature.ts`:

```typescript
import api from '@/api/index'

export async function fetchMyFeature() {
  const response = await api.get('/my-feature')
  return response.data
}

export async function createMyFeature(payload: any) {
  const response = await api.post('/my-feature', payload)
  return response.data
}

export async function updateMyFeature(id: string, payload: any) {
  const response = await api.put(`/my-feature/${id}`, payload)
  return response.data
}
```

Export from `src/api/index.ts`:

```typescript
export * from './myFeature'
```

### 3. Create Component Structure

```
src/components/myFeature/
├── MyFeatureList.vue      # List view
├── MyFeatureDetails.vue   # Details view
├── AddMyFeatureForm.vue   # Create modal form
└── MyFeatureDrawer.vue    # Optional drawer component
```

**MyFeatureList.vue**:

```vue
<script setup>
import { useMyFeatureStore } from '@/stores/myFeature';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const store = useMyFeatureStore();
const router = useRouter();

onMounted(() => {
  store.load();
});

function viewDetails(id: string) {
  router.push({ name: 'my-feature-details', params: { id } });
}
</script>

<template>
  <GenericDataTable
    :data="store.data"
    :loading="store.loading"
    :columns="columns"
    @row-click="(row) => viewDetails(row.id)"
  />
</template>
```

### 4. Create Page Components

Create under `src/pages/MyFeature/`:

```
src/pages/MyFeature/
├── Index.vue   # List page
├── New.vue     # Create page
├── Details.vue # Details page
└── Edit.vue    # Edit page
```

**Index.vue**:

```vue
<script setup>
import MyFeatureList from '@/components/myFeature/MyFeatureList.vue'
</script>

<template>
  <MyFeatureList />
</template>
```

### 5. Add Routes

Update `src/router/index.ts`:

```typescript
const routes = [
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      // ... existing routes
      {
        path: 'my-feature',
        name: 'my-feature-list',
        component: () => import('@/pages/MyFeature/Index.vue'),
      },
      {
        path: 'my-feature/:id',
        name: 'my-feature-details',
        component: () => import('@/pages/MyFeature/Details.vue'),
      },
      {
        path: 'my-feature/:id/edit',
        name: 'my-feature-edit',
        component: () => import('@/pages/MyFeature/Edit.vue'),
      },
    ],
  },
]
```

### 6. Create Form Schema

Create `src/form/myFeatureRules.ts`:

```typescript
import { z } from 'zod'

export const myFeatureCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
})

export type MyFeatureCreatePayload = z.infer<typeof myFeatureCreateSchema>
```

### 7. Create Form Component

Create `src/components/myFeature/AddMyFeatureForm.vue`:

```vue
<script setup>
import { useForm } from '@/composables/useForm'
import { myFeatureCreateSchema } from '@/form/myFeatureRules'
import { useMyFeatureStore } from '@/stores/myFeature'
import { ref } from 'vue'

const emit = defineEmits(['close', 'created'])
const store = useMyFeatureStore()

const form = useForm(myFeatureCreateSchema, {
  name: '',
  description: '',
  status: 'active',
})

const fieldConfig = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'description', label: 'Description', type: 'text' },
  { name: 'status', label: 'Status', type: 'select', data: ['active', 'inactive'] },
]

async function handleSubmit() {
  if (!form.validateForm()) return

  form.isSubmitting.value = true
  try {
    await store.createMyFeature(form.payload.value)
    emit('created')
  } finally {
    form.isSubmitting.value = false
  }
}
</script>

<template>
  <Form :form="form" :fields="fieldConfig" @submit="handleSubmit" @cancel="emit('close')" />
</template>
```

## Development Workflow

### 1. Type Safety

Always use TypeScript:

```typescript
// Good
async function loadMPA(id: string): Promise<MPA> {
  return await fetchMPA(id)
}

// Avoid
async function loadMPA(id) {
  return await fetchMPA(id)
}
```

### 2. Component Naming

Follow naming conventions:

- **Feature components**: `FeatureName.vue` (e.g., `MPAList.vue`)
- **UI components**: `UiElementType.vue` (e.g., `Modal.vue`, `Button.vue`)
- **Page components**: Descriptive names in feature folders

### 3. Store Organization

```typescript
// Bad - too much logic in component
const data = ref(null)
async function load() {
  const resp = await api.get('/data')
  data.value = resp.data
}

// Good - move to store
const store = useMyStore()
onMounted(() => store.load())
```

### 4. Composable Usage

Use composables for:

- Form state management (`useForm`)
- Permission checks (`useCan`)
- Dropdown options (`useDropdownOptions`)
- Custom business logic

Don't use composables for:

- App-wide state (use stores instead)
- Component-specific trivial logic

### 5. Validation

Always validate at boundaries:

```typescript
// API call validation
const schema = z.object({
  email: z.string().email(),
})

// Form submission
if (!form.validateForm()) return

// API response
try {
  const data = schema.parse(response)
} catch (error) {
  // Handle validation error
}
```

### 6. Error Handling

```typescript
// API layer - log and re-throw
try {
  return await api.get('/endpoint')
} catch (error) {
  console.error('API error:', error)
  throw error
}

// Store - handle gracefully
try {
  await fetchData()
} catch (error) {
  console.error('Failed to load:', error)
  this.data = []
}

// Component - show to user
try {
  await store.load()
} catch (error) {
  toast.error('Failed to load data')
}
```

## Testing

### Run Tests

```bash
npm run test          # Run tests
npm run test:ui       # Test UI
npm run test:coverage # Coverage report
```

### Write Tests

```typescript
// test/stores/myFeature.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMyFeatureStore } from '@/stores/myFeature'

describe('MyFeature Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should load feature data', async () => {
    const store = useMyFeatureStore()
    await store.load()
    expect(store.data).toBeDefined()
  })
})
```

## Performance Optimization

### 1. Code Splitting

Routes are automatically lazy-loaded. For components:

```typescript
// Async component for heavy features
const MyHeavyComponent = defineAsyncComponent(() => import('@/components/MyHeavy.vue'))
```

### 2. Computed Properties

```typescript
// Bad - runs on every render
const filtered = data.value.filter((d) => d.active)

// Good - memoized until data changes
const filtered = computed(() => data.value.filter((d) => d.active))
```

### 3. Watchers

```typescript
// Bad - runs frequently
watch(searchQuery, async (query) => {
  results.value = await search(query)
})

// Good - debounced
watch(
  searchQuery,
  asyncDebounce(async (query) => {
    results.value = await search(query)
  }, 500),
)
```

### 4. List Rendering

```typescript
// Use key for proper reconciliation
<div v-for="item in items" :key="item.id">
  {{ item.name }}
</div>
```

## Debugging

### 1. Vue DevTools

Install the Vue.js DevTools browser extension:

- Inspect component tree
- View reactive state
- Track mutations

### 2. Console Logging

```typescript
// Log store state
console.log(useMyStore().$state)

// Log component props/state
console.log(this.$props)

// Conditional logging
if (import.meta.env.DEV) {
  console.log('Debug info')
}
```

### 3. DevTools in Editor

Use VS Code with:

- Volar extension for Vue 3
- ESLint extension
- TypeScript support

## Common Issues

### Issue: Store not updating in template

**Solution**: Return refs, not destructured values

```typescript
// Wrong
const { data } = store

// Right
return store // Then use store.data
// Or
const data = computed(() => store.data)
```

### Issue: API token not sent

**Solution**: Check auth store has token before making requests

```typescript
const auth = useAuthStore()
console.log('Token:', auth.accessToken)
```

### Issue: Form validation not working

**Solution**: Ensure schema matches form fields

```typescript
const form = useForm(z.object({ name: z.string() }), { name: '' })
// Schema property names must match form field names
```

### Issue: Infinite re-renders

**Solution**: Check watchers and computed properties

```typescript
// Bad - infinite loop
watch(
  () => data.value,
  () => {
    data.value.push(newItem) // Triggers watcher
  },
)

// Good - break the cycle
watch(
  () => data.value.length,
  () => {
    // Logic that doesn't modify data
  },
)
```

## Best Practices Checklist

- [ ] Use TypeScript for all code
- [ ] Create stores for feature state
- [ ] Use API modules instead of raw axios
- [ ] Validate with Zod schemas
- [ ] Use composables for reusable logic
- [ ] Handle errors appropriately (log, throw, or user feedback)
- [ ] Use computed for memoization
- [ ] Lazy-load heavy components
- [ ] Add unit tests for utilities and stores
- [ ] Use consistent naming conventions
- [ ] Document complex logic with comments
- [ ] Keep components focused and small
- [ ] Use composition API over Options API
- [ ] Return refs from composables, not values
- [ ] Clean up watchers and effects

## Learning Resources

### Vue 3

- [Vue 3 Official Guide](https://vuejs.org/)
- [Composition API Docs](https://vuejs.org/api/composition-api-setup.html)

### TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript in Vue](https://vuejs.org/guide/typescript/basics.html)

### Pinia

- [Pinia Documentation](https://pinia.vuejs.org/)

### Zod

- [Zod Documentation](https://zod.dev/)

### Tailwind CSS

- [Tailwind Documentation](https://tailwindcss.com/docs)

## Getting Help

1. **Check the docs**: Look in `docs/` folder
2. **Search issues**: GitHub issues for similar problems
3. **Ask team**: Slack or team communication
4. **Read code**: Look at similar features for patterns
5. **Test it**: Run code locally to understand behavior

## Contributing Code

### Before Submitting

1. Run `npm run lint` - Fix any linting issues
2. Run `npm run type-check` - Ensure TypeScript is valid
3. Run `npm run test` - All tests pass
4. Review your changes - Code quality and style
5. Write clear commit messages

### Commit Message Format

```
type(scope): subject

- Feature (feat)
- Bug fix (fix)
- Docs (docs)
- Style (style)
- Refactor (refactor)
- Test (test)

Example: feat(form): add phone number field validation
```

### Pull Request Template

```
## Summary
Brief description of changes.

## Type
- [ ] Feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactoring

## Testing
How to test the changes.

## Checklist
- [ ] Tests pass
- [ ] No linting errors
- [ ] Types are correct
- [ ] Documentation updated
```
