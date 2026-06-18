# State Management (Pinia Stores) Documentation

## Overview

The application uses **Pinia** for state management. Each major feature has its own store that handles:

- Loading state
- Data caching
- API calls and responses
- State mutations

## Architecture

Stores are located in `src/stores/` and follow the composition API pattern with Pinia's `defineStore()`.

### Store Pattern

Each store:

1. **Defines state** with `ref()` and `computed()`
2. **Implements actions** as async or sync functions
3. **Exports both** state and actions from the store

```typescript
export const useMyStore = defineStore('my-store', () => {
  // State
  const data = ref(null)
  const loading = ref(false)

  // Actions
  async function loadData(id: string) {
    loading.value = true
    try {
      const result = await api.fetchData(id)
      data.value = result
    } finally {
      loading.value = false
    }
  }

  return { data, loading, loadData }
})
```

## Core Stores

### Auth Store (`src/stores/auth.ts`)

**Responsibilities:**

- Persist authentication token and user in cookies
- Provide login/logout functionality
- Verify session on app startup
- Track authentication state

**State:**

```typescript
user // Logged-in user object or null
accessToken // JWT token for API requests
isAuthenticated // Computed: true if token exists
```

**Actions:**

- `login(payload)` - Login with email/password
  - Returns: `{ auth_token, user }`
  - Side effects: Stores token/user in cookies, preloads users list

- `logout()` - Clear session
  - Removes cookies
  - Clears user and token

- `setAccessToken(token)` - Update token (used by API interceptor)

- `verifyAuth()` - Verify token validity on app startup
  - Calls `/me` endpoint to validate token
  - Restores token/user from cookies if needed
  - Returns: `true` if authenticated, `false` if needs login
  - Auto-logs out on 401/403 responses

**Usage in Components:**

```typescript
import { useAuthStore } from '@/stores/auth'

export default {
  setup() {
    const auth = useAuthStore()

    async function handleLogin() {
      await auth.login({ email, password })
      // Redirected by router guard after login
    }

    return {
      user: auth.user,
      isAuthenticated: auth.isAuthenticated,
    }
  },
}
```

### MPA Store (`src/stores/mpa.ts`)

**Responsibilities:**

- Load and cache MPA data
- Manage pending (staging) MPAs
- Track loading states for MPA operations

**State:**

```typescript
mpaData // Currently viewed MPA
pendingMPAs // List of MPAs awaiting approval
pendingMpaData // Currently viewed pending MPA
loading // Loading for single MPA
loadingPending // Loading for pending MPA operations
editFields // Field configuration for MPA edit forms
```

**Actions:**

- `loadMpa(id)` - Fetch single MPA by ID
  - Uses: `fetchMPA()` API
  - Sets: `mpaData`

- `loadPendingMPAs()` - Fetch all pending MPAs
  - Uses: `fetchPendingMPAs()` API
  - Sets: `pendingMPAs` array
  - Handles response structure variations

- `loadPendingMpa(stagingId)` - Fetch single pending MPA
  - Uses: `fetchPendingMPA()` API
  - Fallback: Loads from `fetchMyMPAs()` if primary API fails
  - Transforms ordinances data to consistent format
  - Sets: `pendingMpaData`

- `clearPending()` - Reset pending data
  - Clears: `pendingMPAs` and `pendingMpaData`

**Edit Fields:**

The store also exports `editFields` - configuration for edit forms:

```typescript
{
  key: 'complete_name',
  component: 'InputTextField',
  props: { placeholder: 'Enter MPA name' }
}
```

Fields support:

- Static props: passed as-is
- Dynamic props: functions receive `payload` and return props
- Validation: via form rules

**Usage in Components:**

```typescript
import { useMPAStore } from '@/stores/mpa'

const mpaStore = useMPAStore()

// Load MPA
await mpaStore.loadMpa('123')
const mpa = mpaStore.mpaData

// Access loading state for UI
computed(() => mpaStore.loading)
```

### Users Store (`src/stores/users.ts`)

**Responsibilities:**

- Load and cache user list
- Support user lookups by ID
- Track loading states

**State:**

```typescript
list // All users
loading // Loading state
```

**Actions:**

- `fetchAll()` - Load all users
  - Uses: `fetchUsers()` API
  - Sets: `list` array

- `fetchById(id)` - Get single user from cache
  - Returns: User object or undefined
  - Does not make API call (uses cache)

**Usage:**

```typescript
const usersStore = useUsersStore()
await usersStore.fetchAll()
const users = usersStore.list
const user = usersStore.fetchById('user-123')
```

### Options Store (`src/stores/options.ts`)

**Responsibilities:**

- Cache dropdown/select options
- Lazy-load options from API
- Avoid duplicate API calls

**State:**

```typescript
options // Map of option lists (provinces, municipalities, etc.)
```

**Usage:**

```typescript
const optionsStore = useOptionsStore()
const provinces = await optionsStore.getOptions('provinces')
```

### Other Stores

- **Drawer Store** - Manage drawer UI state (open/close, content)
- **Counter Store** - Example counter (can be removed)
- **Points Store** - Map points management
- **Option List Store** - Caching for dropdown options

## Using Stores in Components

### Composition API Setup

```vue
<script setup>
import { useAuthStore } from '@/stores/auth'
import { useMPAStore } from '@/stores/mpa'

const auth = useAuthStore()
const mpaStore = useMPAStore()

// Access state directly
const { user, isAuthenticated } = auth
const { mpaData, loading } = mpaStore

// Call actions
async function loadMPA(id) {
  await mpaStore.loadMpa(id)
}
</script>
```

### Reading State in Templates

```vue
<template>
  <div v-if="mpaStore.loading">Loading...</div>
  <div v-else-if="mpaStore.mpaData">
    {{ mpaStore.mpaData.complete_name }}
  </div>
</template>
```

### Watching Store Changes

```typescript
import { watch } from 'vue'

const mpaStore = useMPAStore()

watch(
  () => mpaStore.mpaData,
  (newData) => {
    console.log('MPA data changed:', newData)
  },
)
```

## Store Patterns & Best Practices

### 1. Loading States

Always track loading separately for different operations:

```typescript
// Good - separate loading states
const loading = ref(false) // Single item
const loadingPending = ref(false) // Pending list

// Bad - single loading for multiple operations
const loading = ref(false) // Which operation?
```

### 2. Response Handling

Stores handle API response variations to prevent components from being fragile:

```typescript
// Store handles this complexity
if (response.data && response.data.data) {
  items = response.data.data
} else if (Array.isArray(response.data)) {
  items = response.data
}
// Component just gets: pendingMPAs
```

### 3. Fallback API Calls

If a specific endpoint fails, try an alternative:

```typescript
try {
  data = await fetchPendingMPA(id)
} catch {
  // Fallback: load from my-mpas endpoint
  const resp = await fetchMyMPAs()
  const staging = resp.data?.staging ?? []
  data = staging.find((item) => item.staging_id === id)
}
```

### 4. Data Transformation

Transform API responses into a consistent format:

```typescript
// Store transforms ordinances before storing
const ordinances = rawOrdinances
  .filter((o) => o.id != null)
  .map((o) => ({
    id: o.id,
    val: o.name ?? o.val,
    attach: o.link ?? o.attach,
    year: o.year ?? null,
    type: o.type ?? null,
  }))
```

## Creating a New Store

### Step 1: Create the file

```typescript
// src/stores/myFeature.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchMyData } from '@/api/myfeature'

export const useMyFeatureStore = defineStore('my-feature', () => {
  const data = ref(null)
  const loading = ref(false)

  async function loadData(id: string) {
    loading.value = true
    try {
      const response = await fetchMyData(id)
      data.value = response.data
    } finally {
      loading.value = false
    }
  }

  return { data, loading, loadData }
})
```

### Step 2: Use in components

```typescript
import { useMyFeatureStore } from '@/stores/myFeature'

const store = useMyFeatureStore()
await store.loadData('id')
```

## Debugging Stores

### Pinia DevTools

Install Pinia DevTools browser extension to:

- View store state in real-time
- Track mutations and actions
- Time-travel debug

### Manual Logging

```typescript
const store = useMyStore()
console.log(store.$state) // All state
store.$subscribe((mutation, state) => {
  console.log('Store changed:', mutation)
})
```

## Common Issues

### Store state not updating in template

Ensure you're not destructuring refs before using:

```typescript
// Wrong - loses reactivity
const { data } = store
return { data }

// Right - maintain reactivity
return { store } // Then use store.data in template
// Or
const data = computed(() => store.data)
return { data }
```

### Store data persisting between routes

Clear data when navigating to prevent stale data:

```typescript
// In component before unload or in route guard
store.clearData()
```

### Multiple calls to same action

The action handles its own loading state - you don't need to prevent duplicate calls, but you can:

```typescript
if (!store.loading) {
  await store.loadData(id)
}
```
