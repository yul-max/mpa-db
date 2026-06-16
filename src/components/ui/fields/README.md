# Form Field Components

This directory contains standardized form field wrapper components that provide consistent styling, flex behavior, and UX patterns across the application.

## Overview

All form field components follow a consistent structure:

- **Full width layout** (`width: 100%`)
- **Flexbox column layout** with proper spacing
- **Unified error handling** with error message display
- **Accessible labels** with proper associations
- **Consistent focus states** with visible feedback

## Available Components

### InputTextField

Text input field supporting standard text inputs and number inputs.

```vue
<InputTextField
  v-model="email"
  label="Email"
  placeholder="example@domain.com"
  error="Email is required"
/>
```

**Props:**

- `modelValue: string | number` - Current input value
- `label?: string` - Field label
- `error?: string` - Error message to display
- `type?: string` (via $attrs) - HTML input type (text, email, number, etc.)
- `placeholder?: string` (via $attrs) - Placeholder text
- `disabled?: boolean` (via $attrs) - Disable the field

---

### PasswordTextField

Password input with visibility toggle and strength indicators.

```vue
<PasswordTextField v-model="password" label="Password" error="Password must meet all criteria" />
```

**Features:**

- Show/hide password toggle
- Real-time password strength validation
- Criteria checklist (minimum length, uppercase, lowercase, number, symbol)

**Props:**

- `modelValue: string | number` - Current password value
- `label?: string` - Field label
- `error?: string` - Error message to display

---

### SelectField

Dropdown select field for choosing from predefined options.

```vue
<SelectField
  v-model="country"
  label="Country"
  placeholder="Select a country"
  :options="countryList"
  error="Country is required"
/>
```

**Props:**

- `modelValue: string | number` - Selected value
- `label?: string` - Field label
- `placeholder?: string` - Placeholder text
- `options?: Array` - Array of options (strings or objects with `value` and `label`)
- `error?: string` - Error message to display
- `id?: string` - For label association

**Option Format:**

```typescript
// Simple array
;['Option 1', 'Option 2', 'Option 3'][
  // Array of objects
  ({ value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' })
]
```

---

### CheckboxField

Checkbox input for boolean selections.

```vue
<CheckboxField
  v-model="agreeToTerms"
  label="I agree to the terms and conditions"
  error="You must agree to continue"
/>
```

**Props:**

- `modelValue: boolean` - Checked state
- `label?: string` - Field label
- `error?: string` - Error message to display
- `id?: string` - For label association (auto-generated if not provided)

---

### SwitchField

Toggle switch for boolean selections with improved UX.

```vue
<SwitchField v-model="enableNotifications" label="Enable notifications" />
```

**Props:**

- `modelValue: boolean` - Toggle state
- `label?: string` - Field label
- `error?: string` - Error message to display
- `id?: string` - For label association (auto-generated if not provided)

---

### FileUploadField

File upload field with multiple file support and file list display.

```vue
<FileUploadField
  v-model="documents"
  label="Upload Documents"
  accept=".pdf,.doc,.docx"
  :multiple="true"
  error="Documents are required"
/>
```

**Props:**

- `modelValue: File[]` - Array of selected files
- `label?: string` - Field label
- `accept?: string` - Accepted file types (e.g., ".pdf,.jpg")
- `multiple?: boolean` - Allow multiple files
- `error?: string` - Error message to display

---

## Using in Forms

### With the Form Component

```vue
<template>
  <Form
    :schema="formSchema"
    :initialValues="initialValues"
    :fields="fieldDefinitions"
    :submit="submitForm"
    submitLabel="Save Changes"
    cancelLabel="Cancel"
  />
</template>

<script setup lang="ts">
import { z } from 'zod'
import Form from '@/components/ui/Form.vue'
import type { FieldDef } from '@/types/forms'

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  country: z.string(),
  agreeToTerms: z.boolean().refine((v) => v === true),
  documents: z.array(z.instanceof(File)),
})

const fieldDefinitions: FieldDef[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email Address',
    placeholder: 'example@domain.com',
    validateOnBlur: true,
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    validateOnInput: true,
  },
  {
    name: 'country',
    type: 'select',
    label: 'Country',
    options: [
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
    ],
  },
  {
    name: 'agreeToTerms',
    type: 'checkbox',
    label: 'I agree to the terms and conditions',
  },
  {
    name: 'documents',
    type: 'file',
    label: 'Upload Documents',
    props: {
      accept: '.pdf,.doc,.docx',
      multiple: true,
    },
  },
]

const initialValues = {
  email: '',
  password: '',
  country: '',
  agreeToTerms: false,
  documents: [],
}

const submitForm = async (values: typeof initialValues) => {
  // Submit form data
  return { success: true, message: 'Form submitted successfully!' }
}
</script>
```

### Standalone Usage

```vue
<template>
  <div class="form-container">
    <InputTextField v-model="formData.name" label="Full Name" @blur="validateField('name')" />
    <p v-if="errors.name" class="error">{{ errors.name }}</p>

    <SelectField v-model="formData.role" label="User Role" :options="roleOptions" />

    <SwitchField v-model="formData.isActive" label="Active User" />

    <button @click="handleSubmit">Submit</button>
  </div>
</template>
```

## Styling Guidelines

### Consistent Layout

All form field components use:

- Flexbox column layout
- Full width (`width: 100%`)
- Proper gap spacing between elements (0.375rem between components)

### Focus States

- Blue border with subtle shadow on focus
- Visual feedback for better accessibility
- Outline removed for clean appearance

### Error States

- Red text color (#dc2626)
- Displayed below the field
- Same font size as placeholder (0.875rem)

### Disabled States

- Reduced opacity (0.6)
- Gray background
- Not-allowed cursor
- Visually distinct from enabled state

## Adding New Field Components

When creating new field components, follow this pattern:

1. **File naming**: `PascalCaseField.vue`
2. **Directory**: Place in `/src/components/ui/fields/`
3. **Structure**:

```vue
<template>
  <div class="custom-field">
    <label v-if="label" :for="id" class="field-label">{{ label }}</label>
    <!-- Your custom input element -->
    <input
      :id="id"
      :value="modelValue"
      class="field-input"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps({
  id: String,
  modelValue: [String, Number], // Adjust type as needed
  label: String,
  error: String,
  // Add other props specific to your field
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()
</script>

<style scoped>
.custom-field {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.375rem;
}

.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}

/* Apply consistent field styles */
/* Use existing field-input, field-error classes where appropriate */
</style>
```

4. **Update the index.ts**:

```typescript
export { default as CustomField } from './CustomField.vue'
```

5. **Update the Form.vue componentMap**:

```typescript
const componentMap: Record<string, unknown> = {
  // ... existing entries
  custom: CustomField,
}
```

6. **Update FieldDef type** if needed in `/src/types/form.ts`:

```typescript
export type FieldDef = {
  name: string
  type?: 'text' | 'password' | 'select' | 'checkbox' | 'switch' | 'file' | 'custom'
  // ... other properties
}
```

## Best Practices

1. **Always use full width** - Set `width: 100%` on the container
2. **Maintain consistent spacing** - Use `gap: 0.375rem` between label, input, and error message
3. **Label association** - Use proper `id` attributes for form accessibility
4. **Error handling** - Always display errors below the field
5. **Focus states** - Provide clear visual feedback on focus
6. **Type safety** - Use TypeScript generics for proper type inference
7. **Accessibility** - Use semantic HTML and ARIA attributes where appropriate

## CSS Classes Reference

- `.custom-field` - Main container (flex column, full width)
- `.field-label` - Label styling (0.875rem, font-weight: 500)
- `.field-input` - Input styling (full width, padding, border, focus states)
- `.field-error` - Error message styling (red, 0.875rem)
- `.field-select` - Select-specific styling (custom dropdown arrow)
- `.field-checkbox` - Checkbox styling (1.25rem size, accent color)
- `.field-switch` - Switch styling (toggle animation)

## Performance

All form field components are optimized for performance:

- Minimal re-renders using Vue 3 composition API
- No unnecessary watchers or computed properties
- Efficient event handling with direct emit
