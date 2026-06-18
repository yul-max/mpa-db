# Utilities & Helper Functions Documentation

## Overview

Utility functions provide common functionality shared across components. Located in `src/utils/`, they handle formatting, form logic, map integration, and data transformation.

## Available Utilities

### Form Helpers (`src/utils/formHelpers.ts`)

Form utilities support common form operations:

```typescript
// Import
import {} from /* functions */ '@/utils/formHelpers'
```

**Common Functions**:

- Field validation helpers
- Form data transformation
- Conditional field display logic
- Default value handling

**Example**:

```typescript
import { getFieldValue, setFieldValue } from '@/utils/formHelpers'

// Get field value with default
const value = getFieldValue(formData, 'province', 'default-value')

// Set nested field value
setFieldValue(formData, 'location.province', 'Cebu')
```

### Formatters (`src/utils/formatters.ts`)

Convert data to display formats:

```typescript
import { formatters } from '@/utils/formatters'

// Format currency
formatters.currency(1234.56) // '$1,234.56'

// Format date
formatters.date(new Date()) // '06/18/2026'

// Format number
formatters.number(1000000) // '1,000,000'
```

**Available Formatters**:

- `currency(value, locale?)` - Format as currency
- `date(value, format?)` - Format as date
- `time(value)` - Format as time
- `number(value)` - Format with thousands separator
- `phone(value)` - Format phone number
- `percentage(value)` - Format as percentage

### GeoServer Utilities (`src/utils/geoserver.ts`)

Helpers for GeoServer integration:

```typescript
import { getGeoServerURL, parseGeoServerResponse } from '@/utils/geoserver'

// Build GeoServer endpoint URL
const url = getGeoServerURL('workspace', 'layer')

// Parse WFS/WMS responses
const features = parseGeoServerResponse(response)
```

### Map API (`src/utils/mapApi.ts`)

Map-related utility functions:

```typescript
import { calculateBounds, centerOnLocation, createMapLayer } from '@/utils/mapApi'

// Calculate map bounds from coordinates
const bounds = calculateBounds([
  [15.7582, 121.625],
  [15.76, 121.64],
])

// Center map on location
centerOnLocation(map, latitude, longitude, zoom)

// Create map layer
const layer = createMapLayer(map, 'layer-name', {
  url: 'http://...',
  opacity: 0.7,
})
```

### Custom Auto-Graticule (`src/utils/customAutoGraticule.ts`)

Leaflet plugin for map grid display:

```typescript
import { CustomAutoGraticule } from '@/utils/customAutoGraticule'

const graticule = new CustomAutoGraticule({
  style: { color: '#000', weight: 1 },
})

map.addLayer(graticule)
```

### Validators (`src/utils/validators.ts`)

Custom validation functions (currently placeholder).

**Planned**:

```typescript
// Email validation
validators.email(value)

// Phone validation
validators.phone(value)

// Custom regex validation
validators.regex(value, pattern)

// Dependent field validation
validators.required(value, condition)
```

### Interfaces (`src/utils/interfaces.ts`)

Shared TypeScript interfaces:

```typescript
// Import common types
import type { MapBounds, GeoPoint, Feature } from '@/utils/interfaces'

// Use in components
const bounds: MapBounds = {
  north: 20,
  south: 10,
  east: 130,
  west: 120,
}
```

## Common Usage Patterns

### Pattern 1: Format List Data

```typescript
import { formatters } from '@/utils/formatters'

const mpas = mpas.map((mpa) => ({
  ...mpa,
  established_date: formatters.date(mpa.date_established),
  total_area_formatted: formatters.number(mpa.total_area),
}))
```

### Pattern 2: Validate Form Field

```typescript
import { validators } from '@/utils/validators'

const emailValid = validators.email(form.payload.email)
if (!emailValid) {
  form.setFieldError('email', 'Invalid email address')
}
```

### Pattern 3: Transform API Response

```typescript
import { parseGeoServerResponse } from '@/utils/geoserver'

async function loadMapFeatures() {
  const response = await geoserverApi.getFeatures('mpas')
  const features = parseGeoServerResponse(response)
  return features
}
```

### Pattern 4: Map Bounds Calculation

```typescript
import { calculateBounds } from '@/utils/mapApi'

const mpaBounds = calculateBounds(mpaCoordinates.map((c) => [c.latitude, c.longitude]))

// Fit map to bounds
map.fitBounds([
  [mpaBounds.south, mpaBounds.west],
  [mpaBounds.north, mpaBounds.east],
])
```

## Best Practices

### 1. Use Utilities Over Duplication

**Bad**:

```typescript
// In Component A
const formatted = `$${value.toFixed(2)}`

// In Component B
const formatted = value.toLocaleString('en-US', { style: 'currency' })
```

**Good**:

```typescript
import { formatters } from '@/utils/formatters'

const formatted = formatters.currency(value)
```

### 2. Type-Safe Formatters

```typescript
import type { Formatter } from '@/utils/formatters'

const customFormatter: Formatter = (value: unknown) => {
  // Implementation
}
```

### 3. Error Handling in Utilities

```typescript
export function safeFormat(value: unknown): string {
  try {
    return formatters.date(value)
  } catch (error) {
    console.warn('Format error:', error)
    return String(value)
  }
}
```

### 4. Utility Composition

```typescript
// Compose utilities for complex operations
export function formatMPAForDisplay(mpa: MPA): DisplayMPA {
  return {
    name: mpa.complete_name,
    established: formatters.date(mpa.date_established),
    area: formatters.number(mpa.total_area),
    location: formatters.coordinates(mpa.latitude, mpa.longitude),
  }
}
```

## Creating New Utilities

### Step 1: Create Utility File

```typescript
// src/utils/myUtility.ts
export function helperFunction(input: string): string {
  // Implementation
  return result
}

export const MyUtilityClass = {
  method1(arg: any) {},
  method2(arg: any) {},
}
```

### Step 2: Export from Module

```typescript
// src/utils/index.ts (if centralized exports)
export * from './myUtility'
```

### Step 3: Use in Components

```typescript
import { helperFunction, MyUtilityClass } from '@/utils/myUtility'

const result = helperFunction('input')
MyUtilityClass.method1(data)
```

## Utility Categories

### Data Transformation

Convert from one format to another:

```typescript
// Numbers
toLocaleString(1000000) // '1,000,000'

// Dates
toISOString()
toLocaleString()
format(date, 'YYYY-MM-DD')

// Objects
flattenObject(nested)
unflattenObject(flat)
```

### Validation

Check if data matches criteria:

```typescript
isEmail(value)
isPhone(value)
isURL(value)
isStrongPassword(value)
```

### Map Operations

Geospatial functions:

```typescript
calculateDistance(point1, point2) // In meters
calculateArea(polygon) // In sq. meters
pointInPolygon(point, polygon) // True/false
```

### API Integration

Prepare data for API calls:

```typescript
buildQueryString(params)
buildFormData(object)
parseErrorResponse(error)
```

## Performance Considerations

### Memoization for Expensive Operations

```typescript
const memoizedFormatter = memoize((value) => {
  // Expensive calculation
  return expensiveFormat(value)
})
```

### Lazy Utilities

Load utilities only when needed:

```typescript
// Dynamic import in component
import { complexUtil } from '@/utils/complex'
```

## Testing Utilities

### Unit Testing Pattern

```typescript
// src/utils/myUtil.test.ts
import { describe, it, expect } from 'vitest'
import { myFunction } from './myUtil'

describe('myFunction', () => {
  it('should format correctly', () => {
    expect(myFunction('input')).toBe('expected')
  })
})
```

### Test Coverage

Utilities should have high test coverage due to:

- No external dependencies
- Pure functions
- Reusable across codebase

## Troubleshooting

### Utility not imported correctly

Check import path:

```typescript
// Wrong
import { formatter } from '@/utils'

// Right
import { formatters } from '@/utils/formatters'
```

### Utility causing performance issues

Profile and optimize:

```typescript
// Use memoization for repeated calls
const cached = memoize(expensiveFunction)

// Lazy-load heavy utilities
const util = await import('@/utils/heavy')
```

### Type errors with utilities

Ensure types match:

```typescript
// Function expects number
formatters.currency(123) // Right
formatters.currency('$123') // Wrong
```

## Utility Guidelines

1. **Keep utilities pure**: No side effects
2. **Use consistent naming**: `format*`, `validate*`, `calculate*`
3. **Add TypeScript types**: All parameters and returns
4. **Document examples**: Show usage in comments
5. **Group related functions**: Similar utilities in same file
6. **Don't over-engineer**: Simple utilities are better
7. **Extract from components**: If logic is duplicated, make it a utility
