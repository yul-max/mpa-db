# MPA Database - Admin Manual

A comprehensive guide for administrators to perform operations in the MPA Database application, including user management, MPA records handling, and codebase maintenance.

---

## Table of Contents

1. [Application Overview](#application-overview)
2. [User Roles and Permissions](#user-roles-and-permissions)
3. [User Operations](#user-operations)
4. [MPA Records Management](#mpa-records-management)
5. [Authentication and Access](#authentication-and-access)
6. [Development and Codebase Maintenance](#development-and-codebase-maintenance)
7. [Common Tasks Checklist](#common-tasks-checklist)

---

## Application Overview

**MPA Database** is a Vue 3 web application for managing Marine Protected Areas (MPAs). It provides:

- **Map Dashboard**: Interactive visualization of MPA locations and details
- **MPA Records**: View, create, edit, and manage MPA records
- **User Management**: Create and manage system users with different roles
- **Upload Queue**: Review and approve/reject pending MPA submissions
- **Real-time Updates**: Data syncs across multiple sessions

### Technology Stack

- **Frontend**: Vue 3, TypeScript, Vite
- **State Management**: Pinia
- **UI Components**: PrimeVue
- **Mapping**: Leaflet with Esri, Mapbox, and vector tiles
- **Testing**: Playwright
- **Package Manager**: npm

---

## User Roles and Permissions

### Role Definitions

| Role | Description | Permissions |
|------|-------------|-------------|
| **Administrator** | Full system access | • Manage all users (create, edit, delete)<br>• View all MPA records<br>• Approve/reject pending MPA submissions<br>• Edit any MPA record<br>• Access admin dashboard and settings<br>• Manage user roles and permissions |
| **Contributor** | Submit and edit own MPAs | • Submit new MPA records<br>• View all approved MPA records<br>• Edit their own submitted MPAs<br>• Upload shapefiles for MPAs<br>• Track their own submissions<br>• Cannot edit other users' MPAs<br>• Cannot approve submissions |
| **Viewer** | Request hidden information | • View all approved MPA records<br>• Request access to hidden/sensitive data<br>• View public map dashboard<br>• Cannot submit new MPAs<br>• Cannot edit any records<br>• Can file information requests with administrators |
| **Guest** | Read-only public access | • View public MPA data and dashboard<br>• View interactive maps<br>• No login required<br>• Cannot submit or edit records<br>• Limited to publicly released information |

### Permission System

Permissions are enforced throughout the application using the `user_type` field:

- **user_type = 1**: Administrator (full access)
- **user_type = 2**: Contributor (create/edit own MPAs)
- **user_type = 3**: Viewer (read-only access)

**Implementation**: Components use direct role checks via the auth store:

```typescript
import { useAuthStore } from '@/stores/auth'

export default {
  setup() {
    const authStore = useAuthStore()
    
    // Check user role
    const isAdmin = computed(() => authStore.user?.user_type === 1)
    const isContributor = computed(() => authStore.user?.user_type === 2)
    const isViewer = computed(() => authStore.user?.user_type === 3)
    
    // Show UI elements conditionally
    if (isAdmin.value) { /* show admin controls */ }
    if (isContributor.value) { /* show upload button */ }
  }
}
```

**Key Permission Checks**:
- Navigation: Only Administrators see the "Users" navigation button
- MPA Editing: Only Administrators can edit any MPA; Contributors can only edit their own
- MPA Deletion: Only Administrators can delete records
- Approval Queue: Only Administrators can view/approve/reject pending MPAs
- MPA Creation: Administrators and Contributors can submit; Viewers cannot

---

## User Operations

### 1. Accessing the Application

#### Login

1. Navigate to the application URL
2. Click **Log In** button on the dashboard
3. Enter credentials:
   - **Username**: Your system username
   - **Password**: Your system password
4. Click **Sign In**
5. You'll be redirected to the MPA Records page

#### Logout

1. Click your **User Profile** button (top-right navigation)
2. Select **Log Out**
3. You'll be returned to the public dashboard

#### Session Management

- Sessions persist across browser reloads (stored in cookies)
- Session remains valid as long as your token is current
- Automatic timeout after inactivity (varies by backend configuration)

### 2. Managing Users (Admin Only)

#### View All Users

1. Navigate to **Users** section (requires admin role)
2. View table showing:
   - Name (First & Last)
   - Email
   - Role
   - Province/Municipality
   - User Type

#### Create a New User

1. Go to **Users** → Click **Create** button
2. Fill in form fields:
   - **First Name**: User's first name
   - **Last Name**: User's last name
   - **Email**: User email address
   - **Username**: Login username
   - **Password**: Initial password
   - **Role**: Select from:
     - **Administrator**: Full system access
     - **Contributor**: Can submit and edit own MPAs
     - **Viewer**: Can request access to specific information
     - **Guest**: Read-only public access (typically not created manually)
   - **Province**: Geographic assignment
   - **Municipality**: Geographic assignment
3. Click **Save**
4. User will receive a confirmation with their login credentials

#### Edit User Details

1. Go to **Users** → Click on user's name or **Edit** button
2. Modify fields as needed:
   - Update email address
   - Change role and permissions
   - Update geographic assignment
3. Click **Save**
4. Changes apply immediately

#### Delete a User

1. Go to **Users** → Click on user
2. Look for **Delete** option or button
3. Confirm deletion
4. User account is permanently removed

#### View User Profile

1. Click your **User Profile** button (top-right)
2. View your personal details:
   - Name and role
   - Email and username
   - Geographic assignment

---

## MPA Records Management

### 1. Viewing MPA Records

#### List All MPAs

1. Navigate to **MPA Records** section
2. View table with columns:
   - MPA Name
   - Type
   - Status
   - Location (Province, Municipality)
   - Area (Total, Core, Buffer)
   - Added by (username)

#### Search and Filter

- **Province Filter**: Select province to show only MPAs in that location
- **Municipality Filter**: Narrow down by municipality
- **Text Search**: Search by MPA name or location
- **Pagination**: Navigate through records (if more than one page)

#### View MPA Details

1. Click on an MPA record name or **View** button
2. Details page shows:
   - **Basic Info**: Name, type, status, location
   - **Area Data**: Total area, core area, buffer area
   - **Coordinates**: Latitude and longitude
   - **Associated Documents**:
     - Ordinances (PDF links)
     - Uploaded shapefiles
     - Supporting documentation
   - **Map View**: Interactive map showing MPA boundaries
   - **Metadata**: Upload date, uploaded by, approval date

### 2. Creating MPA Records

#### Manual Entry (Administrator and Contributor Only)

1. Go to **MPA Records** → Click **Create** button
2. Fill in required fields:
   - **Name**: MPA complete name
   - **Type**: Select MPA type
   - **Year Established**: Year of establishment
   - **Province**: Select from dropdown
   - **Municipality**: Select from dropdown
   - **Barangay**: Select from dropdown
   - **Coordinates**: Enter latitude and longitude
   - **Area Information**:
     - Total Area (hectares)
     - Core Area (hectares)
     - Buffer Area (hectares)
3. Click **Save** to create

**Note for Contributors**: Your submission will go to the pending queue and require Administrator approval before being published.

#### Bulk Upload via Shapefile (Administrator and Contributor Only)

1. Go to **MPA Records** → Click **Upload** button
2. Upload file options:
   - **.zip**: Shapefile archive (shape, shx, dbf, prj required)
   - **.geojson**: GeoJSON format file
   - **.json**: JSON format file
3. (Optional) Override fields in form:
   - Use form fields to override values from file
   - Useful for adding missing data or corrections
4. Click **Upload**
5. New records go to **Pending Queue** for review (see Approval Workflow below)

### 3. Editing MPA Records

#### Edit Approved Record

**Administrators** can edit any MPA record:
1. View MPA details
2. Click **Edit** button
3. Modify fields as needed
4. Click **Save**

**Contributors** can only edit their own submitted MPAs:
1. View MPA record you submitted
2. Click **Edit** button (only available on your own records)
3. Modify fields as needed
4. Click **Save**

**Viewers** cannot edit any records.

#### Edit Pending Record

Pending MPAs cannot be edited. Must be approved first or rejected and resubmitted.

### 4. Deleting MPA Records (Administrator Only)

1. View MPA details
2. Click **Delete** button
3. Confirm deletion
4. Record is permanently removed

Only Administrators can delete MPA records. Contributors and Viewers cannot delete records.

### 5. MPA Approval Workflow (Administrator Only)

#### View Pending Submissions

1. Navigate to **Pending MPAs** or **Upload Queue**
2. Table shows:
   - MPA Name
   - Upload Status
   - Submitted by (user)
   - Upload date
   - Number of features

Only Administrators can view and manage the pending queue.

#### Review Pending MPA

1. Click on pending MPA record
2. Review information:
   - Basic details (name, type, location)
   - Area measurements
   - Map visualization
   - Associated ordinances
   - Submission details
3. Check for data accuracy and completeness

#### Approve Pending MPA

1. Open pending MPA details
2. Click **Approve** button
3. (Optional) Add comments or notes
4. Confirm approval
5. MPA moves to **Approved Records**
6. Contributor receives confirmation notification

#### Reject Pending MPA

1. Open pending MPA details
2. Click **Reject** button
3. **Enter reason for rejection**:
   - Missing required fields
   - Incorrect coordinates
   - Incomplete area information
   - Other issues
4. Confirm rejection
5. Record returns to pending and contributor is notified
6. Contributor can correct and resubmit

### 6. Managing Associated Documents

#### View Ordinances

1. Open MPA details
2. Scroll to **Ordinances** section
3. View list of associated ordinances:
   - Name
   - Year
   - Document type
   - Link to PDF

#### Upload Supporting Documents

1. Go to MPA **Edit** page
2. Find document upload section
3. Select file (PDF, image, or document)
4. Assign document type/category
5. Save

#### Remove Documents

1. Open MPA details or edit page
2. Find document in list
3. Click **Remove** or **Delete** icon
4. Confirm removal

### 7. Information Requests (Viewer Feature)

Viewers can request access to specific information that is hidden from public viewing. This allows controlled access to sensitive data.

#### Submitting an Information Request (Viewer)

1. While viewing an MPA record or from the dashboard
2. Click **Request Information** button
3. Fill in request details:
   - **Type of Information**: Specify what data you need
   - **Reason for Request**: Explain the purpose
   - **Urgency**: Indicate time sensitivity (if applicable)
4. Submit request
5. Administrators will review and respond

#### Processing Information Requests (Administrator Only)

1. Navigate to **Information Requests** or **Pending Requests**
2. Review pending requests with:
   - Requester name and role
   - Type of information requested
   - Reason for request
   - Submission date
3. Click on request to view full details
4. **Approve** request:
   - Grant access to requested information
   - User is notified with data access
5. **Deny** request:
   - Provide reason for denial
   - User is notified with explanation

---

## Authentication and Access

### Session Management

#### Session Duration

- Default session timeout: 24 hours (or as configured)
- Session persists across page refreshes
- Automatic re-authentication on token refresh

#### Token Management

- Access tokens stored in cookies
- Automatic token refresh on API requests
- Invalid/expired tokens trigger automatic logout

#### Multiple Sessions

- Can log in from multiple devices
- Each session is independent
- Logging out on one device doesn't affect other sessions

### Password Management

#### Change Your Password

1. Click **User Profile** → **Settings** (if available)
2. Look for **Change Password** option
3. Enter:
   - Current password
   - New password
   - Confirm new password
4. Save changes

#### Reset Forgotten Password

Contact your system administrator with:
- Your username
- Email address
- Administrator will initiate password reset

---

## Development and Codebase Maintenance

### 1. Environment Setup

#### Prerequisites

- **Node.js**: v20.19.0 or >=22.12.0 (check with `node --version`)
- **npm**: v9+ (check with `npm --version`)
- **Git**: For version control

#### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd mpa-db

# Install dependencies
npm install

# Start development server
npm run dev

# Application runs at http://localhost:5173
```

#### IDE Setup

**Recommended**: VS Code with extensions:
- [Vue.js DevTools](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [Vetur](https://marketplace.visualstudio.com/items?itemName=octref.vetur) (disable if using official Vue extension)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### 2. Project Structure Guide

```
mpa-db/
├── src/
│   ├── api/              # API endpoint modules (users, mpa, auth)
│   ├── components/       # Vue components
│   │   ├── auth/         # Login, logout components
│   │   ├── mpa/          # MPA-related components
│   │   ├── users/        # User management components
│   │   └── ui/           # Shared UI primitives
│   ├── composables/      # Reusable Vue 3 composition functions
│   ├── forms/            # Form validation and field types
│   ├── pages/            # Full-page components (routes)
│   ├── router/           # Vue Router configuration
│   ├── stores/           # Pinia state management stores
│   ├── styles/           # Global CSS/SCSS
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── main.ts           # Application entry point
├── tests/
│   └── e2e/              # Playwright end-to-end tests
├── docs/                 # Documentation
├── playwright.config.ts  # Playwright test configuration
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
└── tsconfig.json         # TypeScript configuration
```

### 3. Common Development Tasks

#### Running Development Server

```bash
# Start with hot-reload
npm run dev

# Runs at http://127.0.0.1:5173
# Automatically reloads on file changes
```

#### Type Checking

```bash
# Check for TypeScript errors
npm run type-check

# Watch mode (continuous checking)
npm run type-check -- --watch
```

#### Linting and Formatting

```bash
# Run ESLint and auto-fix issues
npm run lint

# Format code with Prettier (auto-fixes formatting)
npm run format
```

#### Building for Production

```bash
# Type-check and build
npm run build

# Output: dist/ directory with optimized files

# Preview production build locally
npm run preview
```

### 4. Adding a New Feature

#### Step 1: Create API Module

Create `src/api/myFeature.ts`:

```typescript
import api from './index';

export const fetchMyFeatures = (params: any) => 
  api.get('/my-features', { params });

export const fetchMyFeature = (id: string | number) => 
  api.get(`/my-features/${id}`);

export const createMyFeature = (data: any) => 
  api.post('/my-features', data);

export const updateMyFeature = (id: string | number, data: any) => 
  api.put(`/my-features/${id}`, data);

export const deleteMyFeature = (id: string | number) => 
  api.delete(`/my-features/${id}`);
```

#### Step 2: Create Pinia Store

Create `src/stores/myFeature.ts`:

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as myFeatureApi from '@/api/myFeature';

export const useMyFeatureStore = defineStore('my-feature', () => {
  const items = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAll(params?: any) {
    loading.value = true;
    error.value = null;
    try {
      const response = await myFeatureApi.fetchMyFeatures(params);
      items.value = response.data;
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function create(data: any) {
    try {
      await myFeatureApi.createMyFeature(data);
      await fetchAll();
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  }

  return { items, loading, error, fetchAll, create };
});
```

#### Step 3: Create Routes

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
        component: () => import('@/pages/MyFeature/Index.vue')
      },
      {
        path: 'my-feature/new',
        name: 'my-feature-new',
        component: () => import('@/pages/MyFeature/New.vue')
      },
      {
        path: 'my-feature/:id',
        name: 'my-feature-details',
        component: () => import('@/pages/MyFeature/Details.vue')
      }
    ]
  }
];
```

#### Step 4: Create Pages/Components

Create `src/pages/MyFeature/Index.vue`:

```vue
<template>
  <div>
    <h1>My Features</h1>
    <button @click="navigateTo('/my-feature/new')">Create</button>
    <table>
      <tr v-for="item in store.items" :key="item.id">
        <td>{{ item.name }}</td>
        <td>
          <router-link :to="`/my-feature/${item.id}`">View</router-link>
        </td>
      </tr>
    </table>
  </div>
</template>

<script setup lang="ts">
import { useMyFeatureStore } from '@/stores/myFeature';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

const store = useMyFeatureStore();
const router = useRouter();

onMounted(() => {
  store.fetchAll();
});

const navigateTo = (path: string) => router.push(path);
</script>
```

### 5. Testing

#### Run End-to-End Tests

```bash
# Run all tests
npm run test:e2e

# Interactive UI mode (recommended for development)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Run critical path tests only (smoke tests)
npm run test:e2e:smoke
```

#### Write a New Test

Create `tests/e2e/my-feature.spec.ts`:

```typescript
import playwright from '@playwright/test';
import { setupApiMocks } from './helpers/mockApi';

const { test, expect } = playwright;

test.describe('My Feature', () => {
  test('displays list of features', async ({ page }) => {
    await setupApiMocks(page, { authenticated: true, role: 'admin' });
    
    await page.goto('/my-feature');
    await expect(page.getByRole('heading', { name: 'My Features' }))
      .toBeVisible();
  });

  test('creates new feature', async ({ page }) => {
    await setupApiMocks(page, { authenticated: true, role: 'admin' });
    
    await page.goto('/my-feature');
    await page.getByRole('button', { name: 'Create' }).click();
    
    await page.getByLabel('Name').fill('New Feature');
    await page.getByRole('button', { name: 'Save' }).click();
    
    await expect(page.getByText('Created successfully'))
      .toBeVisible();
  });
});
```

See [docs/PLAYWRIGHT_TESTING.md](./PLAYWRIGHT_TESTING.md) for comprehensive testing guide.

### 6. Code Quality

#### Type Safety

- Always use TypeScript types for props, state, and API responses
- Avoid `any` type—use proper interfaces

#### Code Organization

- One component per file
- Group related utilities in folders
- Keep composables focused on single responsibilities
- Use descriptive names

#### Performance

- Lazy-load routes with dynamic imports
- Memoize expensive computations
- Avoid unnecessary re-renders in Vue components
- Profile with Vue DevTools

### 7. Working with Git

#### Basic Workflow

```bash
# Check status
git status

# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add my feature"

# Push to remote
git push origin feature/my-feature

# Create pull request on GitHub
# Review changes, merge to main
```

#### Commit Message Format

```
<type>: <description>

<optional detailed explanation>

# Types: feat, fix, docs, style, refactor, perf, test, chore
# Example: feat: add MPA approval workflow
```

### 8. Deployment

#### Build Production Version

```bash
# Full build process with type checking
npm run build

# Output in dist/ directory

# Preview build locally
npm run preview
```

#### Deployment Steps

1. **Push to main branch** after PR approval
2. **CI/CD Pipeline** runs:
   - Type checking (`npm run type-check`)
   - Linting (`npm run lint`)
   - Tests (`npm run test:e2e`)
   - Build (`npm run build`)
3. **Artifacts** deployed to production server
4. **Verify deployment** at production URL

### 9. Troubleshooting

#### Development Server Not Starting

```bash
# Check Node version
node --version  # Should be 20.19.0+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

#### TypeScript Errors

```bash
# Run type checker
npm run type-check

# Fix fixable issues
npm run lint
```

#### Build Failures

```bash
# Check for syntax errors
npm run type-check

# View build output
npm run build -- --verbose
```

#### Test Failures

```bash
# Run in UI mode for debugging
npm run test:e2e:ui

# Run specific test
npx playwright test tests/e2e/my-test.spec.ts

# Debug mode
npx playwright test --debug
```

### 10. Documentation

#### Update Documentation

1. Documentation in `docs/` directory
2. Update relevant `.md` files
3. Commit with message: `docs: update <section>`

#### Key Documentation Files

- `docs/DEVELOPMENT_GUIDE.md` - Developer setup
- `docs/COMPONENTS.md` - Component architecture
- `docs/API_LAYER.md` - API structure
- `docs/STATE_MANAGEMENT.md` - Pinia stores
- `docs/FORM_SYSTEM.md` - Form validation
- `docs/PLAYWRIGHT_TESTING.md` - Test writing guide

---

## Common Tasks Checklist

### For Administrators

- [ ] **First Time Setup**
  - [ ] Complete developer environment setup
  - [ ] Run `npm install`
  - [ ] Run `npm run dev` to verify installation
  - [ ] Create initial user accounts (Contributor, Viewer, Administrator roles)
  - [ ] Configure application settings

- [ ] **Daily Operations**
  - [ ] Review pending MPA submissions
  - [ ] Approve or reject pending records
  - [ ] Review pending information requests from Viewers
  - [ ] Monitor active users
  - [ ] Check for error logs

- [ ] **User Management**
  - [ ] Create new user accounts with appropriate roles
  - [ ] Update user roles and permissions as needed
  - [ ] Reset user passwords
  - [ ] Remove inactive users
  - [ ] Promote Contributors to Administrators if needed

- [ ] **Data Management**
  - [ ] Review MPA records for accuracy
  - [ ] Process bulk uploads from Contributors
  - [ ] Manage hidden/sensitive information access
  - [ ] Archive old records (if applicable)
  - [ ] Backup database

### For Contributors

- [ ] **Submitting New MPAs**
  - [ ] Prepare MPA data (coordinates, area, location info)
  - [ ] Submit via manual entry or bulk upload
  - [ ] Verify submission appears in "My MPAs" pending list
  - [ ] Wait for Administrator approval

- [ ] **Managing Submissions**
  - [ ] Monitor status of submitted MPAs
  - [ ] Review feedback if submission is rejected
  - [ ] Edit and resubmit if needed
  - [ ] Download/view approved records

- [ ] **Data Quality**
  - [ ] Ensure accurate coordinates before submission
  - [ ] Include complete area information
  - [ ] Attach supporting documentation
  - [ ] Follow geographic naming conventions

### For Viewers

- [ ] **Accessing Information**
  - [ ] View approved public MPA records
  - [ ] Use interactive map dashboard
  - [ ] Identify MPAs needing more information

- [ ] **Requesting Information**
  - [ ] Submit information requests for hidden data
  - [ ] Provide clear reason for request
  - [ ] Monitor request status
  - [ ] Receive notification when approved

- [ ] **Using Granted Access**
  - [ ] Access approved information from requests
  - [ ] Use data for intended purpose
  - [ ] Report issues or concerns to Administrators

- [ ] **Setup**
  - [ ] Clone repository
  - [ ] Install dependencies (`npm install`)
  - [ ] Start dev server (`npm run dev`)
  - [ ] Install IDE extensions

- [ ] **Before Commit**
  - [ ] Run type check (`npm run type-check`)
  - [ ] Run linter (`npm run lint`)
  - [ ] Run tests (`npm run test:e2e`)
  - [ ] Verify build (`npm run build`)

- [ ] **Adding Features**
  - [ ] Create API module
  - [ ] Create Pinia store
  - [ ] Add routes
  - [ ] Create components/pages
  - [ ] Write tests
  - [ ] Update documentation
  - [ ] Create pull request

- [ ] **Maintenance**
  - [ ] Update dependencies regularly
  - [ ] Review and fix security vulnerabilities
  - [ ] Monitor application performance
  - [ ] Keep documentation current

---

## Additional Resources

### Application Documentation

- [Playwright Testing Guide](./PLAYWRIGHT_TESTING.md) - How to write and run tests
- [Quick Reference](./QUICK_REFERENCE.md) - Development quick reference
- [Component Documentation](./components/README.md) - Component API reference
- [Technical Documentation](./INDEX.md) - Complete technical reference

### External Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Playwright Documentation](https://playwright.dev/)

### Support

For issues or questions:
1. Check existing documentation
2. Search GitHub issues for similar problems
3. Consult development team
4. Review application logs for errors

---

**Last Updated**: June 2026  
**Document Version**: 1.0

