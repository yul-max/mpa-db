# Quick Reference Cheatsheet

## Core Concepts at a Glance

### API Layer

```typescript
// Create client
import api from '@/api/index'

// Use in API module
export async function fetchData() {
  const response = await api.get('/endpoint')
  return response.data
}

// Token refresh: automatic (no code needed)
// Authentication: automatic Bearer token injection
```

### State Management (Stores)

```typescript
// Define store
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMyStore = defineStore('my-store', () => {
  const data = ref(null)
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      data.value = await api.get('/data')
    } finally {
      loading.value = false
    }
  }

  return { data, loading, load }
})

// Use in component
const store = useMyStore()
await store.load()
const value = store.data
```

### Forms & Validation

```typescript
import { useForm } from '@/composables/useForm'
import { z } from 'zod'

// Schema
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})

// Form state
const form = useForm(schema, {
  email: '',
  name: '',
})

// Validate
if (form.validateForm()) {
  // Submit form.payload.value
}
```

### Composables

```typescript
// useForm - form state & validation
const form = useForm(schema, initialValues)

// useCan - permission checks
const canEdit = useCan('edit:feature')

// useDropdownOptions - load select options
const { options, loading } = useDropdownOptions({
  url: '/api/provinces',
  callback: (resp) => resp.data,
})
```

### Routing

```typescript
import { useRouter, useRoute } from 'vue-router';

// Navigate
const router = useRouter();
router.push({ name: 'route-name', params: { id: '123' } });

// Get current route
const route = useRoute();
const id = route.params.id;
const query = route.query.search;

// Add route
{
  path: 'feature',
  name: 'feature-list',
  component: () => import('@/pages/Feature.vue'),
  meta: { requiresAuth: true },
}
```

---

## Component Structure Template

```vue
<script setup>
import { useStore } from '@/stores/store'
import { useForm } from '@/composables/useForm'
import { useCan } from '@/composables/useCan'
import { computed, ref } from 'vue'

// 1. Permissions
const canEdit = useCan('edit:feature')

// 2. Stores
const store = useStore()

// 3. State
const isOpen = ref(false)

// 4. Computed
const data = computed(() => store.data)

// 5. Methods
async function handleAction() {
  // Implementation
}

// 6. Lifecycle
onMounted(() => {
  store.load()
})
</script>

<template>
  <!-- Template -->
</template>

<style scoped>
/* Styles */
</style>
```

---

## API Endpoint Pattern

```typescript
// src/api/feature.ts
import api from '@/api/index'

// Export endpoint functions
export async function fetchFeatures() {
  const response = await api.get('/features')
  return response.data
}

export async function createFeature(data: any) {
  const response = await api.post('/features', data)
  return response.data
}

export async function updateFeature(id: string, data: any) {
  const response = await api.put(`/features/${id}`, data)
  return response.data
}

export async function deleteFeature(id: string) {
  const response = await api.delete(`/features/${id}`)
  return response.data
}
```

---

## Store Pattern

```typescript
// src/stores/feature.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchFeatures, createFeature } from '@/api/feature'

export const useFeatureStore = defineStore('feature', () => {
  const data = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      data.value = await fetchFeatures()
    } catch (err: any) {
      error.value = err.message
      data.value = []
    } finally {
      loading.value = false
    }
  }

  async function create(payload: any) {
    try {
      const result = await createFeature(payload)
      data.value.push(result)
      return result
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  return { data, loading, error, load, create }
})
```

---

## Form Validation Pattern

```typescript
// src/form/featureRules.ts
import { z } from 'zod'

export const featureCreateSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  status: z.enum(['active', 'inactive']),
  description: z.string().optional(),
})

export type FeatureCreatePayload = z.infer<typeof featureCreateSchema>
```

---

## Common Patterns

### Pattern: Load & Display List

```typescript
<script setup>
const store = useFeatureStore();

onMounted(() => store.load());
</script>

<template>
  <div v-if="store.loading">Loading...</div>
  <div v-else-if="store.error">{{ store.error }}</div>
  <table v-else>
    <tr v-for="item in store.data" :key="item.id">
      <td>{{ item.name }}</td>
    </tr>
  </table>
</template>
```

### Pattern: Form Submission

```typescript
const form = useForm(schema, initialValues)

async function handleSubmit() {
  if (!form.validateForm()) return

  form.isSubmitting.value = true
  try {
    await store.create(form.payload.value)
    toast.success('Created successfully')
    form.resetForm()
  } catch (error) {
    toast.error('Failed to create')
  } finally {
    form.isSubmitting.value = false
  }
}
```

### Pattern: Permission Guard

```typescript
const canEdit = useCan('edit:feature');

<button v-if="canEdit" @click="edit">Edit</button>
<span v-else>No permission</span>
```

### Pattern: Dependent Dropdowns

```typescript
const form = useForm(schema, initialValues)

const { options: provinces } = useDropdownOptions({
  url: '/api/provinces',
})

const { options: municipalities } = useDropdownOptions({
  url: computed(() =>
    form.payload.province
      ? `/api/municipalities?province=${form.payload.province}`
      : '/api/municipalities',
  ),
})

watch(
  () => form.payload.province,
  () => {
    form.setFieldValue('municipality', '')
  },
)
```

---

## Debugging

```typescript
// Check auth
const auth = useAuthStore()
console.log('User:', auth.user)
console.log('Token:', auth.accessToken)

// Check store state
const store = useMyStore()
console.log(store.$state)

// Watch changes
store.$subscribe((mutation, state) => {
  console.log('Store changed:', mutation)
})

// Watch computed
watch(
  () => store.data,
  (newVal) => {
    console.log('Data changed:', newVal)
  },
)

// Conditional logging
if (import.meta.env.DEV) {
  console.log('Debug info')
}
```

---

## Common Imports

```typescript
// Vue
import { ref, computed, watch, onMounted } from 'vue'
import { defineComponent, defineAsyncComponent } from 'vue'

// Router
import { useRouter, useRoute } from 'vue-router'

// Stores
import { useAuthStore } from '@/stores/auth'
import { useMPAStore } from '@/stores/mpa'

// Composables
import { useForm } from '@/composables/useForm'
import { useCan } from '@/composables/useCan'
import { useDropdownOptions } from '@/composables/useDropdownOptions'

// Form
import { z } from 'zod'

// API
import api from '@/api/index'
import { fetchMPA, createMPA } from '@/api/mpa'

// Utilities
import { formatters } from '@/utils/formatters'
```

---

## TypeScript Patterns

### Type API Response

```typescript
interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

async function fetchData(): Promise<ApiResponse<MyType>> {
  return await api.get('/endpoint')
}
```

### Type Store Actions

```typescript
async function loadData(): Promise<MyType | null> {
  try {
    data.value = await fetchData()
    return data.value
  } catch (error) {
    console.error(error)
    return null
  }
}
```

### Generic Composable

```typescript
function useGenericLoader<T>(url: string) {
  const data = ref<T | null>(null)
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      const response = await api.get<T>(url)
      data.value = response.data
    } finally {
      loading.value = false
    }
  }

  return { data, loading, load }
}
```

---

## File Organization

```
src/
├── api/                 # API endpoint modules
│   ├── index.ts         # Axios client
│   ├── feature.ts       # Feature endpoints
│   └── auth.ts          # Auth endpoints
├── stores/              # Pinia stores
│   ├── auth.ts
│   ├── feature.ts
│   └── options.ts
├── composables/         # Reusable logic
│   ├── useForm.ts
│   ├── useCan.ts
│   └── useDropdownOptions.ts
├── form/                # Form system
│   ├── featureRules.ts  # Validation schemas
│   ├── fields.ts        # Field config
│   └── steps.ts         # Multi-step config
├── components/          # Vue components
│   ├── ui/              # UI primitives
│   ├── auth/            # Auth feature
│   ├── feature/         # Feature components
│   └── mpa/             # MPA feature
├── pages/               # Page components
│   ├── Feature/
│   ├── MPA/
│   └── Users/
├── router/              # Vue Router
│   └── index.ts
├── utils/               # Helper functions
│   ├── formatters.ts
│   ├── validators.ts
│   └── mapApi.ts
└── types/               # TypeScript types
    ├── index.ts
    ├── forms.ts
    └── api.ts
```

---

## Key Files Quick Access

| File                         | Purpose                     |
| ---------------------------- | --------------------------- |
| `src/api/index.ts`           | Axios client & interceptors |
| `src/router/index.ts`        | Route definitions           |
| `src/stores/auth.ts`         | Authentication state        |
| `src/composables/useForm.ts` | Form management             |
| `src/main.ts`                | App entry point             |
| `.env.local`                 | Environment variables       |
| `vite.config.ts`             | Build configuration         |

---

## Troubleshooting Quick Fixes

| Issue                       | Check                                      |
| --------------------------- | ------------------------------------------ |
| Component not reactive      | Return `ref`, not value                    |
| Store state not updating    | Use `store` directly, not destructured     |
| API token not sent          | Check `useAuthStore().accessToken`         |
| Form validation not working | Schema properties match field names        |
| Route not found             | Check route added to `router/index.ts`     |
| Infinite re-renders         | Check `watch` and `computed` for mutations |
| Permission check failing    | Verify user has role/permission set        |
| Dropdown not loading        | Check API endpoint returns correct format  |

---

## Environment Variables

```bash
# .env.local
VITE_LOCALE_URL=http://localhost:3000/api
VITE_GEOSERVER_URL=http://localhost:8080/geoserver
# Add as needed
```

---

## Common Commands

```bash
npm run dev           # Start dev server
npm run build         # Build for production
npm run type-check    # Check TypeScript
npm run lint          # Run linter
npm run test          # Run tests
npm run test:ui       # Test UI
```

---

## Component Props Pattern

```typescript
interface Props {
  modelValue: string
  label?: string
  disabled?: boolean
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Label',
  disabled: false,
  placeholder: 'Enter text',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: []
}>()
```

---

## Quick Navigation

- **Documentation Index**: [docs/INDEX.md](INDEX.md)
- **Architecture Overview**: [docs/COMPONENTS.md](COMPONENTS.md)
- **Complete Dev Guide**: [docs/DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)
- **Full API Docs**: [docs/API_LAYER.md](API_LAYER.md)
- **State Management**: [docs/STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)
