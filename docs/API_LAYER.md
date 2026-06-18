# API Layer Documentation

## Overview

The API layer handles all HTTP communication with the backend server. It's built on Axios and manages authentication, token refresh logic, and provides clean abstractions for different API endpoints.

## Architecture

### Main API Instance (`src/api/index.ts`)

The main API instance is created with Axios and configured with:

- **Base URL**: Uses `VITE_LOCALE_URL` environment variable (defaults to `/api`)
- **Headers**: Content-Type set to `application/json`
- **Auto-token injection**: All requests automatically include the Bearer token from auth store

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_LOCALE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})
```

### Request Interceptor

Every outgoing request automatically includes the Bearer token from the auth store:

```typescript
api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.accessToken) {
    ;(config as any).headers = {
      ...(config as any).headers,
      Authorization: `Bearer ${auth.accessToken}`,
    }
  }
  return config
})
```

**When it runs**: Before any API call is sent to the server.

### Response Interceptor & Token Refresh

The response interceptor implements a **token refresh flow** to handle expired tokens:

#### Flow:

1. **Check for 401 Response**: If a response returns 401 (Unauthorized), it means the token has expired
2. **Queue Pending Requests**: While refreshing the token, other concurrent requests are queued
3. **Refresh Token**: Call `/auth/refresh` endpoint to get a new token
4. **Update Store & Retry**: Update the auth store with the new token and retry the original request
5. **Retry Queued Requests**: Process all queued requests with the new token
6. **Handle Refresh Failure**: If refresh fails, log out the user

#### Key Variables:

- `isRefreshing`: Boolean flag to prevent multiple simultaneous refresh attempts
- `failedQueue`: Array storing promises for queued requests during refresh

#### Usage Pattern:

From a component or composable, simply call the API:

```typescript
import api from '@/api/index'

// No need to manually handle token refresh
const response = await api.get('/some-endpoint')
```

The interceptor handles token expiration transparently.

## Endpoint Modules

### Auth API (`src/api/authApi.ts`)

Handles authentication-related calls:

```typescript
export async function loginUser(payload: LoginFormPayload) {
  // Returns: { auth_token, user }
}
```

### MPA API (`src/api/mpa.ts`)

Handles all Marine Protected Area (MPA) operations:

- `fetchMPA(id)` - Get single MPA
- `fetchPendingMPAs()` - List all pending MPAs awaiting approval
- `fetchPendingMPA(stagingId)` - Get specific pending MPA
- `fetchMyMPAs()` - Get MPAs uploaded by current user
- `createMPA(data)` - Submit new MPA for approval
- `updateMPA(id, data)` - Update pending MPA data

#### Response Structure:

Most MPA endpoints follow this structure:

```typescript
{
  success: boolean,
  count?: number,
  data: MpaRecord | MpaRecord[] | { staging: [...] }
}
```

**Note**: The store handles response structure variations automatically.

### Users API (`src/api/users.ts`)

Handles user management:

- `fetchUsers()` - List all users
- `fetchUser(id)` - Get single user
- `createUser(data)` - Create new user
- `updateUser(id, data)` - Update user

### Geoserver API (`src/api/geoserver.ts`)

Reserved for GeoServer integration (currently empty).

## Usage Patterns

### Basic GET Request

```typescript
import api from '@/api/index'

try {
  const response = await api.get('/mpa/123')
  const mpaData = response.data
} catch (error) {
  // Handle error - token refresh already attempted if applicable
  console.error('Failed to fetch MPA:', error)
}
```

### POST Request with Data

```typescript
const response = await api.post('/mpa', {
  complete_name: 'New MPA',
  province: 'Cebu',
  // ... other fields
})
```

### Endpoint-Specific Modules

Instead of using raw `api.get()`, use the endpoint modules which provide typed functions:

```typescript
import { fetchMPA, createMPA } from '@/api/mpa'

// Better - returns typed data
const mpaData = await fetchMPA('123')
const newMPA = await createMPA(formData)
```

## Error Handling

### Network Errors

If a request fails due to network issues, the promise is rejected with the error. Catch it in your component:

```typescript
try {
  await fetchMPA(id)
} catch (error) {
  // Network error, timeout, or server 5xx error
  toast.error('Failed to load MPA')
}
```

### Authentication Errors (401/403)

These are automatically handled by the response interceptor:

- **401**: Token is expired → triggers refresh flow
- **403**: User lacks permission → auto-logout occurs

After auto-logout, the component should check `auth.isAuthenticated` to determine if redirect is needed.

### Server Errors (4xx/5xx)

These are passed through to the calling code. The interceptor does not retry server errors.

## Environment Configuration

The API base URL is controlled by the `VITE_LOCALE_URL` environment variable:

```bash
# .env.local
VITE_LOCALE_URL=http://localhost:3000/api
```

If not set, defaults to `/api` (relative URL).

## Adding New Endpoints

### 1. Create a module under `src/api/`

```typescript
// src/api/locations.ts
import api from '@/api/index'

export async function fetchLocations() {
  const response = await api.get('/locations')
  return response.data
}

export async function createLocation(data: LocationPayload) {
  const response = await api.post('/locations', data)
  return response.data
}
```

### 2. Export from `src/api/index.ts`

```typescript
export { fetchLocations, createLocation } from './locations'
```

### 3. Use in stores or components

```typescript
import { fetchLocations } from '@/api/locations'

const locations = await fetchLocations()
```

## Best Practices

1. **Don't use raw `api.get()`**: Create endpoint modules for each feature
2. **Handle errors in calling code**: Don't add error handling to the API module
3. **Let interceptors work**: Don't manually check or refresh tokens - the interceptor handles it
4. **Type responses**: Use TypeScript types for API responses
5. **Keep modules focused**: One module per feature area

## Troubleshooting

### Token not being sent

Check that the auth store has the token set:

```typescript
const auth = useAuthStore()
console.log('Token:', auth.accessToken) // Should not be null
```

### Infinite redirect loop

If you see a redirect loop, the token refresh might be failing. Check:

1. Does `/auth/refresh` endpoint exist?
2. Is the refresh token stored correctly?
3. Look at browser DevTools Network tab for the 401 response

### CORS errors

CORS errors mean the browser blocked the request. Check:

1. Backend has correct CORS headers
2. API base URL matches backend origin
3. Credentials are being sent if needed
