# Routing & Navigation Documentation

## Overview

The application uses **Vue Router** for client-side routing. All routes are organized under a single `AppLayout` to maintain a consistent header and sidebar while switching page content.

## Router Configuration

Located in `src/router/index.ts`:

```typescript
const routes = [
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    children: [
      // All routes are children of AppLayout
      { path: '', name: 'dashboard', component: ... },
      { path: 'mpa', name: 'mpas-list', component: ... },
      // ...
    ]
  }
];
```

## Route Structure

### Feature Routes

Routes are organized by feature domain:

| Path               | Name                 | Component     | Auth Required | Purpose              |
| ------------------ | -------------------- | ------------- | ------------- | -------------------- |
| `/`                | dashboard            | MapDashboard  | No            | Map view of all MPAs |
| `/mpa`             | mpas-list            | MPAs/Index    | No            | List all MPAs        |
| `/mpa/new`         | mpas-new             | MPAs/New      | No            | Create new MPA       |
| `/mpa/:id`         | mpas-details         | MPAs/Details  | No            | View MPA details     |
| `/mpa/:id/edit`    | mpas-edit            | MPAs/Edit     | No            | Edit existing MPA    |
| `/mpa/pending/:id` | mpas-pending-details | MPAs/Details  | No            | View pending MPA     |
| `/users`           | users-list           | Users/Index   | Yes\*         | List all users       |
| `/users/new`       | users-new            | Users/New     | Yes\*         | Create new user      |
| `/users/:id`       | users-details        | Users/Details | Yes\*         | View user details    |
| `/users/:id/edit`  | users-edit           | Users/Edit    | Yes\*         | Edit user            |
| `/technical-docs`  | technical-docs       | TechnicalDocs | No\*\*        | Dev documentation    |

_Yes_ = Requires authentication  
**Dev only** = Only visible in dev environment

### Route Metadata

Each route can have metadata flags:

```typescript
meta: {
  requiresAuth: true,  // Route needs logged-in user
  public: true,        // Route accessible without login
  devOnly: true,       // Only shows in development
  pending: true,       // Route is for pending/staging items
}
```

## Navigation Guards

### Global Before Hook

The router implements a global `beforeEach` guard:

```typescript
router.beforeEach((to) => {
  const auth = useAuthStore()

  // Hide dev-only routes outside development
  if (to.meta.devOnly && !import.meta.env.DEV) {
    return { name: 'dashboard' }
  }

  // Block authenticated routes when not logged in
  if (to.meta.requiresAuth && (!auth.user || !auth.isAuthenticated)) {
    return { name: 'dashboard' }
  }
})
```

**Behaviors**:

1. **Dev-only routes**: Automatically redirect to dashboard if `meta.devOnly` is true outside dev environment
2. **Auth-required routes**: Redirect to dashboard if `meta.requiresAuth` is true and user isn't authenticated

## Programmatic Navigation

### Navigate by Name

```typescript
import { useRouter } from 'vue-router'

const router = useRouter()

// Navigate to MPA details
router.push({ name: 'mpas-details', params: { id: '123' } })

// Navigate with query params
router.push({
  name: 'mpas-list',
  query: { status: 'pending', page: 2 },
})
```

### Navigate by Path

```typescript
// Direct path navigation
router.push('/mpa/123')
router.push({ path: '/mpa' })
```

### Back Navigation

```typescript
router.back()
router.go(-1) // Go back 1 page
router.go(2) // Go forward 2 pages
```

## Getting Route Info

### Access Current Route

```typescript
import { useRoute } from 'vue-router'

const route = useRoute()

console.log(route.name) // Current route name
console.log(route.params.id) // Route params
console.log(route.query.status) // Query params
console.log(route.meta.requiresAuth) // Metadata
```

### Watch for Route Changes

```typescript
import { useRoute } from 'vue-router'
import { watch } from 'vue'

const route = useRoute()

watch(
  () => route.params.id,
  (newId) => {
    console.log('ID changed to:', newId)
    // Load new data
  },
)
```

## Common Patterns

### Pattern 1: List to Details Navigation

```vue
<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function viewMPA(id: string) {
  router.push({ name: 'mpas-details', params: { id } });
}
</script>

<template>
  <table>
    <tr v-for="mpa in mpas" @click="viewMPA(mpa.id)">
      {{
        mpa.name
      }}
    </tr>
  </table>
</template>
```

### Pattern 2: Breadcrumb Navigation

```vue
<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

const breadcrumbs = computed(() => {
  if (route.name === 'mpas-list') {
    return [{ label: 'MPAs', to: '/mpa' }]
  }
  if (route.name === 'mpas-details') {
    return [
      { label: 'MPAs', to: '/mpa' },
      { label: route.params.id, to: route.path },
    ]
  }
  return []
})
</script>

<template>
  <div class="breadcrumbs">
    <span v-for="(crumb, i) in breadcrumbs">
      <router-link :to="crumb.to">{{ crumb.label }}</router-link>
      <span v-if="i < breadcrumbs.length - 1">/</span>
    </span>
  </div>
</template>
```

### Pattern 3: Confirmation Before Navigation

```vue
<script setup>
import { useRouter } from 'vue-router';
import { ref } from 'vue';

const router = useRouter();
const hasChanges = ref(false);

async function handleNavigate(to: any) {
  if (hasChanges.value) {
    const confirmed = await confirmDialog(
      'You have unsaved changes. Leave anyway?'
    );
    if (!confirmed) return;
  }
  router.push(to);
}
</script>
```

### Pattern 4: Query Params for State

```typescript
// Save filter state in URL
router.push({
  name: 'mpas-list',
  query: {
    province: selectedProvince,
    status: selectedStatus,
    page: currentPage,
  },
})

// Restore from query params on mount
const route = useRoute()
const province = route.query.province || ''
const status = route.query.status || ''
const page = route.query.page || 1
```

## Adding New Routes

### Step 1: Create Page Component

```vue
<!-- src/pages/MyFeature/Index.vue -->
<script setup>
import { useMyStore } from '@/stores/myFeature'

const store = useMyStore()

onMounted(() => {
  store.loadData()
})
</script>

<template>
  <div>Page Content</div>
</template>
```

### Step 2: Add to Router

```typescript
// src/router/index.ts
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
        meta: { requiresAuth: true }, // If auth required
      },
      {
        path: 'my-feature/:id',
        name: 'my-feature-details',
        component: () => import('@/pages/MyFeature/Details.vue'),
      },
    ],
  },
]
```

## Route-Based Layouts

### Conditional Layout Components

Different routes can use different layouts:

```typescript
// Keep current single-layout approach
routes: [
  {
    path: '/',
    component: AppLayout,
    children: [
      /* all app routes */
    ],
  },
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      /* auth pages */
    ],
  },
]
```

## Meta Tags and Document Title

For better SEO and page identification, update document title:

```typescript
router.afterEach((to) => {
  const title = getTitleFromRoute(to.name)
  document.title = `${title} - MPA DB`
})
```

## Lazy Loading Routes

Routes are already lazy-loaded with dynamic imports:

```typescript
component: () => import('@/pages/MPAs/Index.vue')
```

This splits routes into separate chunks loaded on-demand.

## Route Parameters

### URL Parameters

```typescript
// Route: /mpa/:id/edit
// URL:   /mpa/123/edit

const route = useRoute()
const id = route.params.id // '123'
```

### Query Parameters

```typescript
// URL: /mpa?page=2&status=active

const route = useRoute()
const page = route.query.page // '2'
const status = route.query.status // 'active'
```

### Type-Safe Parameters

```typescript
// Define expected param types
interface MPADetailsRoute {
  params: {
    id: string
  }
}

// Use in navigation
router.push<MPADetailsRoute>({
  name: 'mpas-details',
  params: { id: '123' },
})
```

## Router Lifecycle

### Route Change Flow

1. **beforeEach guards** - Global guards run
2. **Component beforeRouteLeave** - Leaving component hooks
3. **Component beforeRouteEnter** - Entering component hooks
4. **afterEach hooks** - Post-navigation
5. **Component mounted** - New component mounts

### Common Lifecycle Tasks

```typescript
// Route entering
beforeRouteEnter(to, from, next) {
  // Load data before component mounts
  next(vm => {
    vm.loadData();
  });
}

// Route leaving
beforeRouteLeave(to, from, next) {
  // Confirm unsaved changes
  if (hasChanges) {
    if (confirm('Unsaved changes. Leave?')) next();
  } else {
    next();
  }
}

// Route updating (params change but same component)
beforeRouteUpdate(to, from, next) {
  // Re-load data when params change
  this.loadData(to.params.id);
  next();
}
```

## Troubleshooting

### Route not found / 404

Check that:

1. Route is added to routes array
2. Route name is correct (if using route names)
3. Route is under the AppLayout children

### Component not updating when route params change

Use `beforeRouteUpdate` or watch route params:

```typescript
watch(
  () => route.params.id,
  async (newId) => {
    await store.load(newId)
  },
)
```

### Navigation not working

Check that:

1. Router is properly initialized
2. Using `useRouter()` or `<router-link>`
3. No navigation guards preventing route change
4. Browser console for errors

### Back button not working

Use `router.back()` instead of `router.go()`:

```typescript
// Right
router.back()

// Also works but less common
router.go(-1)
```
