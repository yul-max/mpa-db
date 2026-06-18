# Form System Documentation

## Overview

The form system provides a schema-driven, reusable infrastructure for building forms across the application. It combines **Zod validation**, **Vue 3 composition API**, and **field-based configuration** to create maintainable, type-safe forms.

## Architecture

The form system is located in `src/form/` and consists of:

```
src/form/
├── fields.ts          # Field type definitions
├── rules.ts           # Validation rules
├── registry.ts        # Field component registry
├── steps.ts           # Multi-step form configuration
├── getStepConfig.ts   # Step configuration getter
├── setupFormFields.ts # Form field setup
├── plugin.ts          # Vue plugin for form system
```

## Core Components

### 1. Field Types (`src/form/fields.ts`)

Defines the available form field types and their configuration:

```typescript
export const formFieldList = [
  {
    name: 'name',
    label: 'MPA Name',
    type: 'text',
    required: true,
  },
  {
    name: 'province',
    label: 'Province',
    type: 'select',
    data: ['Cebu', 'Bohol', 'Palawan'],
  },
  {
    name: 'municipality',
    label: 'Municipality',
    type: 'select',
    source: {
      url: '/api/municipalities?province={province}',
      callback: (resp: any) => resp.items || resp,
    },
    hidden: (m: any) => !m.province,
  },
  // ... more fields
]
```

**Field Configuration Options:**

| Option     | Type            | Purpose                                         |
| ---------- | --------------- | ----------------------------------------------- |
| `name`     | string          | Field identifier (used in form data)            |
| `label`    | string          | Display label                                   |
| `type`     | string          | Field type (text, select, checkbox, file, etc.) |
| `required` | boolean         | Is this field mandatory?                        |
| `data`     | array           | Static options for select fields                |
| `source`   | object          | Dynamic options loader (URL + callback)         |
| `hidden`   | function        | Conditional visibility based on form state      |
| `props`    | object/function | Additional props passed to field component      |

### 2. Validation Rules (`src/form/rules.ts`)

Defines Zod validation schemas for forms:

```typescript
import { z } from 'zod'

export const mpaCreateSchema = z.object({
  complete_name: z.string().min(1, 'Name is required'),
  province: z.string().min(1, 'Province is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  // ... more fields
})

export type MpaCreatePayload = z.infer<typeof mpaCreateSchema>
```

**Using Rules:**

```typescript
import { mpaCreateSchema } from '@/form/rules'

const form = useForm(mpaCreateSchema, initialValues)
// form now provides: payload, errors, isFormValid, validateField(), etc.
```

### 3. Registry (`src/form/registry.ts`)

Maps field type names to Vue components:

```typescript
// Example registry entry
{
  'InputTextField': () => import('@/components/ui/fields/InputTextField.vue'),
  'DropdownField': () => import('@/components/ui/fields/DropdownField.vue'),
  'CheckboxField': () => import('@/components/ui/fields/CheckboxField.vue'),
  // ...
}
```

## Using Forms in Components

### Basic Form Setup

```vue
<script setup>
import { useForm } from '@/composables/useForm'
import { mpaCreateSchema } from '@/form/rules'
import Form from '@/components/ui/Form.vue'

const initialValues = {
  complete_name: '',
  province: '',
  municipality: '',
  latitude: null,
  longitude: null,
}

const form = useForm(mpaCreateSchema, initialValues)
</script>

<template>
  <Form :form="form" :fields="fieldConfig" @submit="handleSubmit" @cancel="handleCancel" />
</template>
```

### Form Composable (`src/composables/useForm.ts`)

The `useForm()` composable provides form state management with Zod validation:

**State:**

```typescript
payload // Form data object
errors // Validation errors { fieldName: 'error message' }
touched // Tracks which fields have been interacted with
isFormValid // Computed: true if form passes all validations
isSubmitting // Track async submission
```

**Methods:**

```typescript
// Validate single field (marks as touched)
validateField(fieldName)

// Validate entire form
const isValid = validateForm()

// Reset to initial values
resetForm()

// Update field value (optionally validate)
setFieldValue(fieldName, value)

// Manually set error for a field
setFieldError(fieldName, 'Error message')
```

**Options:**

```typescript
const form = useForm(schema, initialValues, {
  validateOnBlur: true, // Validate when field loses focus
  validateOnChange: true, // Validate as user types
})
```

### Example: Simple Form

```vue
<script setup>
import { useForm } from '@/composables/useForm'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
})

const form = useForm(
  loginSchema,
  {
    email: '',
    password: '',
  },
  {
    validateOnBlur: true,
  },
)

async function handleSubmit() {
  if (!form.validateForm()) return

  form.isSubmitting.value = true
  try {
    await api.login(form.payload.value)
  } finally {
    form.isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <input v-model="form.payload.email" @blur="form.validateField('email')" />
      <span v-if="form.errors.email" class="error">
        {{ form.errors.email }}
      </span>
    </div>

    <div>
      <input
        v-model="form.payload.password"
        type="password"
        @blur="form.validateField('password')"
      />
      <span v-if="form.errors.password" class="error">
        {{ form.errors.password }}
      </span>
    </div>

    <button :disabled="!form.isFormValid || form.isSubmitting">Login</button>
  </form>
</template>
```

### Example: Schema-Driven Form

```typescript
// 1. Define field configuration
const fieldConfig = [
  {
    name: 'complete_name',
    label: 'MPA Name',
    type: 'text',
    required: true,
  },
  {
    name: 'province',
    label: 'Province',
    type: 'select',
    required: true,
  },
  {
    name: 'municipality',
    label: 'Municipality',
    type: 'select',
    hidden: (payload) => !payload.province,
  },
]

// 2. Define validation schema
const mpaSchema = z.object({
  complete_name: z.string().min(1, 'Name required'),
  province: z.string().min(1, 'Province required'),
  municipality: z.string().optional(),
})

// 3. Create form
const form = useForm(mpaSchema, initialValues)
```

## Form Component (`src/components/ui/Form.vue`)

The `Form.vue` component is the primary form renderer that:

1. Takes field configuration and renders appropriate field components
2. Manages form submission and validation
3. Emits events for submit, cancel, and validation errors
4. Handles loading states during async submission

**Props:**

```typescript
form: FormState       // Result from useForm()
fields: FieldConfig[] // Array of field configs
submitText?: string   // Default: 'Submit'
cancelText?: string   // Default: 'Cancel'
```

**Events:**

```typescript
@submit="(values) => {}"  // Fired when valid form submitted
@cancel="() => {}"         // Fired when cancel clicked
@error="(errors) => {}"    // Fired if validation fails
```

**Usage:**

```vue
<Form :form="form" :fields="fieldConfig" @submit="handleSubmit" @cancel="handleCancel" />
```

## Field Components

Located in `src/components/ui/fields/`, these components normalize input behavior:

### InputTextField

```vue
<InputTextField
  v-model="value"
  type="text"         <!-- or: number, email, date, etc -->
  placeholder="..."
  required
  @blur="validateField"
/>
```

### DropdownField

```vue
<DropdownField
  v-model="selected"
  :options="[{label, value}, ...]"
  placeholder="Select..."
  disabled
/>
```

### CheckboxField

```vue
<CheckboxField v-model="checked" label="Agree to terms" />
```

### FileField

```vue
<FileField v-model="files" multiple accept=".pdf,.doc" />
```

## Multi-Step Forms

For complex forms split across multiple steps:

### Step Configuration

```typescript
// src/form/steps.ts
export const mpaCreateSteps = [
  {
    id: 'basic',
    label: 'Basic Information',
    fields: ['complete_name', 'year_established', 'date_established'],
  },
  {
    id: 'location',
    label: 'Location',
    fields: ['province', 'municipality', 'barangay'],
  },
  {
    id: 'dimensions',
    label: 'Area Dimensions',
    fields: ['core_area', 'buffer_area', 'total_area'],
  },
]
```

### Usage in Component

```typescript
import { mpaCreateSteps } from '@/form/steps'

const currentStep = ref(0)
const steps = mpaCreateSteps

const currentFields = computed(() => {
  return fieldConfig.filter((f) => steps[currentStep.value].fields.includes(f.name))
})

function nextStep() {
  if (form.validateForm()) {
    currentStep.value++
  }
}

function previousStep() {
  currentStep.value--
}
```

## Creating Custom Field Types

### Step 1: Create field component

```vue
<!-- src/components/ui/fields/CustomField.vue -->
<script setup>
const props = defineProps({
  modelValue: {},
  label: String,
  // ... other props
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="field">
    <label>{{ label }}</label>
    <!-- Custom field implementation -->
  </div>
</template>
```

### Step 2: Register in registry

```typescript
// src/form/registry.ts
export const fieldRegistry = {
  CustomField: () => import('@/components/ui/fields/CustomField.vue'),
}
```

### Step 3: Use in form config

```typescript
const fieldConfig = [
  {
    name: 'customField',
    type: 'CustomField',
    label: 'Custom',
    props: {
      /* props */
    },
  },
]
```

## Validation Best Practices

### 1. Schema-Based Validation

Always use Zod schemas for consistency:

```typescript
// Good
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// Avoid - manual validation in components
if (!email.includes('@')) errors.push('Invalid email')
```

### 2. Reusable Rules

Extract common patterns into rule definitions:

```typescript
const emailField = z.string().email('Invalid email')
const passwordField = z.string().min(8, 'Min 8 chars')

const loginSchema = z.object({
  email: emailField,
  password: passwordField,
})

const signupSchema = z
  .object({
    email: emailField,
    password: passwordField,
    confirmPassword: passwordField,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
```

### 3. Conditional Validation

Use Zod's `.refine()` for complex validation:

```typescript
const schema = z
  .object({
    province: z.string(),
    municipality: z.string().optional(),
  })
  .refine((data) => (data.province ? !!data.municipality : true), {
    message: 'Municipality required when province selected',
    path: ['municipality'],
  })
```

## Common Patterns

### Dependent Fields

When one field depends on another:

```typescript
// Field config with hidden/dynamic props
const fields = [
  { name: 'country', type: 'select', data: countries },
  {
    name: 'state',
    type: 'select',
    // Only show if country selected
    hidden: (payload) => !payload.country,
    // Dynamic options based on country
    source: {
      url: '/api/states?country={country}',
      callback: (resp) => resp.states,
    },
  },
]
```

### Loading Options

```typescript
const fields = [
  {
    name: 'municipality',
    type: 'select',
    source: {
      url: '/api/municipalities?province={province}',
      callback: (resp) => resp.map((m) => ({ label: m.name, value: m.id })),
    },
  },
]
```

### File Upload

```typescript
const fields = [
  {
    name: 'documents',
    type: 'file',
    required: true,
    props: {
      multiple: true,
      accept: '.pdf,.doc,.docx',
    },
  },
]
```

## Troubleshooting

### Validation not working

Check that your Zod schema matches your form structure:

```typescript
// Component form
const form = useForm(z.object({ email: z.string() }), { email: '' })

// Schema must match field names in form data
```

### Field not updating

Ensure you're using `v-model` correctly:

```vue
<!-- Wrong - no v-model binding -->
<input :value="form.payload.name" />

<!-- Right - two-way binding -->
<input v-model="form.payload.name" />
```

### Dynamic options not loading

Check that placeholder syntax matches:

```typescript
// Correct - {fieldName} syntax for dynamic URL
source: {
  url: '/api/data?parent={province}'
}

// Component must have 'province' field in payload
```
