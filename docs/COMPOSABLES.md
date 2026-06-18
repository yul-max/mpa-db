# Composables Documentation

## Overview

Composables are Vue 3 Composition API functions that encapsulate reusable logic. They follow the `use*` naming convention and can be used in any component setup function.

## Available Composables

All composables are located in `src/composables/`.

### useForm

**Purpose**: Manage form state with Zod schema validation.

**Signature**:

```typescript
function useForm<T extends Record<string, any>>(
  schema: z.ZodSchema,
  initialValues: T,
  options?: {
    validateOnBlur?: boolean
    validateOnChange?: boolean
  },
): {
  payload: Ref<T>
  errors: Ref<Partial<Record<keyof T, string>>>
  touched: Ref<Partial<Record<keyof T, boolean>>>
  isFormValid: ComputedRef<boolean>
  isSubmitting: Ref<boolean>
  validateField: (field: keyof T) => void
  validateForm: () => boolean
  resetForm: () => void
  setFieldValue: (field: keyof T, value: any) => void
  setFieldError: (field: keyof T, error: string) => void
}
```

**Returns**:

| Property        | Type     | Purpose                                        |
| --------------- | -------- | ---------------------------------------------- |
| `payload`       | Ref      | Form data - reactive reference to field values |
| `errors`        | Ref      | Error messages - `{ fieldName: 'message' }`    |
| `touched`       | Ref      | Which fields user has interacted with          |
| `isFormValid`   | Computed | True if form passes all validations            |
| `isSubmitting`  | Ref      | Track if form is being submitted               |
| `validateField` | Function | Validate single field, mark as touched         |
| `validateForm`  | Function | Validate all fields, returns boolean           |
| `resetForm`     | Function | Reset to initial values                        |
| `setFieldValue` | Function | Update field value                             |
| `setFieldError` | Function | Manually set error message                     |

**Example**:

```typescript
import { useForm } from '@/composables/useForm'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const form = useForm(schema, {
  email: '',
  password: '',
})

// Validate on submit
function handleSubmit() {
  if (!form.validateForm()) return
  // Form is valid, submit...
}

// Update field
form.setFieldValue('email', 'user@example.com')

// Check errors
if (form.errors.email) {
  console.log('Email error:', form.errors.email)
}
```

See [Form System Documentation](FORM_SYSTEM.md) for more details.

---

### useCan

**Purpose**: Check user permissions for conditional rendering and actions.

**Signature**:

```typescript
function useCan(permission: string): ComputedRef<boolean>
```

**Returns**: Computed boolean indicating if user has permission.

**Example**:

```typescript
import { useCan } from '@/composables/useCan';

const canEdit = useCan('edit:mpa');
const canDelete = useCan('delete:mpa');
const canManageUsers = useCan('manage:users');

// In template
<button v-if="canEdit">Edit MPA</button>
```

**Permission Checks**:

Permissions are read from the authenticated user's role/permissions. The store determines what permissions a user has based on their role.

---

### useDropdownOptions

**Purpose**: Lazy-load and cache dropdown/select options.

**Signature**:

```typescript
function useDropdownOptions(source: { url: string; callback?: (response: any) => any }): {
  options: Ref<any[]>
  loading: Ref<boolean>
  error: Ref<string | null>
}
```

**Parameters**:

| Parameter         | Type     | Purpose                                 |
| ----------------- | -------- | --------------------------------------- |
| `source.url`      | string   | API endpoint to fetch options from      |
| `source.callback` | function | Transform API response to option format |

**Returns**:

| Property  | Type | Purpose                              |
| --------- | ---- | ------------------------------------ |
| `options` | Ref  | Array of options (cached after load) |
| `loading` | Ref  | True while fetching                  |
| `error`   | Ref  | Error message if request fails       |

**Example**:

```typescript
import { useDropdownOptions } from '@/composables/useDropdownOptions';

// Load provinces
const { options: provinces, loading } = useDropdownOptions({
  url: '/api/provinces',
  callback: (resp) => resp.data.map(p => ({
    label: p.name,
    value: p.id,
  })),
});

// In template
<select v-if="!loading">
  <option v-for="p in provinces" :key="p.value" :value="p.value">
    {{ p.label }}
  </option>
</select>
```

**Dependent Dropdowns**:

For cascading selects, pass a getter for dynamic URL:

```typescript
const municipality = ref('')

const { options: barangays } = useDropdownOptions({
  url: computed(() => `/api/barangays?municipality=${municipality.value}`),
  callback: (resp) => resp.data,
})

watch(municipality, () => {
  // Re-fetches when municipality changes
})
```

---

### useFileUpload

**Purpose**: Handle file uploads with progress tracking.

**Status**: Currently placeholder (not fully implemented).

**Planned Signature**:

```typescript
function useFileUpload(options?: { maxSize?: number; acceptedTypes?: string[] }): {
  files: Ref<File[]>
  progress: Ref<number>
  uploading: Ref<boolean>
  upload: (files: File[]) => Promise<any>
  clear: () => void
}
```

---

### usePagination

**Purpose**: Manage paginated list state (page, limit, offset).

**Status**: Currently placeholder (not fully implemented).

**Planned Signature**:

```typescript
function usePagination(options?: { pageSize?: number; initialPage?: number }): {
  page: Ref<number>
  pageSize: Ref<number>
  offset: Ref<number>
  nextPage: () => void
  previousPage: () => void
  goToPage: (page: number) => void
  setPageSize: (size: number) => void
}
```

---

## Composable Patterns

### Pattern 1: Permission Guards

```typescript
<script setup>
const canCreate = useCan('create:mpa');
const canEdit = useCan('edit:mpa');
const canDelete = useCan('delete:mpa');
</script>

<template>
  <button v-if="canCreate" @click="showCreateForm">New MPA</button>
  <table>
    <tr v-for="mpa in mpas">
      <button v-if="canEdit" @click="editMpa(mpa)">Edit</button>
      <button v-if="canDelete" @click="deleteMpa(mpa)">Delete</button>
    </tr>
  </table>
</template>
```

### Pattern 2: Dependent Dropdowns with Form

```typescript
<script setup>
import { useForm } from '@/composables/useForm';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { z } from 'zod';
import { watch } from 'vue';

const schema = z.object({
  province: z.string(),
  municipality: z.string(),
  barangay: z.string(),
});

const form = useForm(schema, {
  province: '',
  municipality: '',
  barangay: '',
});

// Provinces - static
const { options: provinces } = useDropdownOptions({
  url: '/api/provinces',
});

// Municipalities - updates when province changes
const { options: municipalities } = useDropdownOptions({
  url: computed(() =>
    form.payload.province
      ? `/api/municipalities?province=${form.payload.province}`
      : '/api/municipalities'
  ),
});

// Barangays - updates when municipality changes
const { options: barangays } = useDropdownOptions({
  url: computed(() =>
    form.payload.municipality
      ? `/api/barangays?municipality=${form.payload.municipality}`
      : '/api/barangays'
  ),
});

// Reset dependent fields when parent changes
watch(() => form.payload.province, () => {
  form.setFieldValue('municipality', '');
  form.setFieldValue('barangay', '');
});

watch(() => form.payload.municipality, () => {
  form.setFieldValue('barangay', '');
});
</script>
```

### Pattern 3: Combining Multiple Composables

```typescript
<script setup>
import { useForm } from '@/composables/useForm';
import { useCan } from '@/composables/useCan';
import { useDropdownOptions } from '@/composables/useDropdownOptions';
import { useMPAStore } from '@/stores/mpa';

const mpaStore = useMPAStore();
const canCreate = useCan('create:mpa');

const schema = z.object({
  complete_name: z.string(),
  province: z.string(),
});

const form = useForm(schema, initialValues);

const { options: provinces } = useDropdownOptions({
  url: '/api/provinces',
});

async function handleSubmit() {
  if (!form.validateForm() || !canCreate) return;

  form.isSubmitting.value = true;
  try {
    await mpaStore.createMPA(form.payload.value);
    toast.success('MPA created successfully');
  } catch (error) {
    toast.error('Failed to create MPA');
  } finally {
    form.isSubmitting.value = false;
  }
}
</script>
```

---

## Creating Custom Composables

### Structure

```typescript
// src/composables/useMyFeature.ts
import { ref, computed, watch } from 'vue'

export function useMyFeature(initialValue?: string) {
  // State
  const state = ref(initialValue || '')

  // Computed
  const isActive = computed(() => !!state.value)

  // Methods
  function activate(value: string) {
    state.value = value
  }

  function deactivate() {
    state.value = ''
  }

  // Watchers
  watch(state, (newVal) => {
    console.log('State changed:', newVal)
  })

  // Return public API
  return {
    state,
    isActive,
    activate,
    deactivate,
  }
}
```

### Guidelines

1. **Keep composables focused**: Each composable should handle one concern
2. **Return typed objects**: Make return type clear
3. **Handle cleanup**: If using intervals/listeners, clean up in lifecycle
4. **Document parameters**: Use JSDoc comments for public API
5. **Avoid side effects**: Keep composables pure except for state management

### Example: Data Loading Composable

```typescript
// src/composables/useDataLoader.ts
import { ref, computed } from 'vue'
import api from '@/api/index'

export function useDataLoader<T>(url: string, options?: { autoLoad?: boolean }) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get(url)
      data.value = response.data
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  function reset() {
    data.value = null
    error.value = null
  }

  const hasData = computed(() => !!data.value)

  if (options?.autoLoad) {
    load()
  }

  return {
    data,
    loading,
    error,
    hasData,
    load,
    reset,
  }
}
```

Usage:

```typescript
const {
  data: mpas,
  loading,
  error,
  load,
} = useDataLoader<MPA[]>('/api/mpas', {
  autoLoad: true,
})
```

---

## Best Practices

1. **Use composables for logic reuse**: Avoid duplicating logic across components
2. **Combine with stores**: Use composables for component-level logic, stores for app-level state
3. **Reactive references**: Always return refs/computed for reactive state
4. **Provide type generics**: Make composables reusable with TypeScript generics
5. **Document side effects**: Clearly document if composable makes API calls or has other effects
6. **Error handling**: Composables should handle errors gracefully or re-throw with context

---

## Troubleshooting

### Composable not reactive

Check that you're returning refs, not just values:

```typescript
// Wrong - returns static value
return { value: ref('').value }

// Right - returns reactive ref
return { value: ref('') }
```

### Multiple calls creating duplicates

Ensure composables don't automatically trigger side effects:

```typescript
// Call load() explicitly if needed
const { load, data } = useDataLoader('/api/data')
await load()
```

### Composable state shared between components

Each component gets its own composable instance:

```typescript
// Component A
const form1 = useForm(schema, values)

// Component B
const form2 = useForm(schema, values) // Different instance, no sharing
```

To share state, use a store instead.
