# Form Field Migration Guide

This document provides guidance on migrating existing forms to use the new standardized field components.

## What Changed?

Previously, the Form component used PrimeVue components:

- `InputTextPrime`
- `DropdownPrime`
- `CheckboxPrime`
- `ToggleSwitchPrime`
- `FileUploadPrime`

Now, it uses custom form field wrappers with consistent styling:

- `InputTextField`
- `PasswordTextField`
- `SelectField`
- `CheckboxField`
- `SwitchField`
- `FileUploadField`

## Benefits

✅ **Consistent flex behavior** - All fields now take full width and have proper spacing  
✅ **Unified styling** - Standardized colors, borders, focus states across all fields  
✅ **Better UX** - Improved error display, focus indicators, and visual feedback  
✅ **Easier maintenance** - Single source of truth for field styling  
✅ **Future-proof** - New field types can be added following the same pattern

## Migration Steps

### Step 1: Update Field Definitions

The `type` property remains the same, but all components now use the new wrappers:

```typescript
// BEFORE
const fieldDefinitions: FieldDef[] = [
  {
    name: 'email',
    type: 'text',
    label: 'Email Address',
    props: { type: 'email' },
  },
]

// AFTER (no change needed!)
const fieldDefinitions: FieldDef[] = [
  {
    name: 'email',
    type: 'email', // Changed to 'email' for clarity (but 'text' still works)
    label: 'Email Address',
  },
]
```

### Step 2: Field Type Reference

| Old Type     | New Type                            | Component           |
| ------------ | ----------------------------------- | ------------------- |
| `'text'`     | `'text'` or `'email'` or `'number'` | `InputTextField`    |
| `'password'` | `'password'`                        | `PasswordTextField` |
| `'select'`   | `'select'`                          | `SelectField`       |
| `'checkbox'` | `'checkbox'`                        | `CheckboxField`     |
| `'switch'`   | `'switch'`                          | `SwitchField`       |
| `'file'`     | `'file'`                            | `FileUploadField`   |

### Step 3: Common Patterns

#### Simple Text Input

```typescript
// No changes needed for existing implementations
{
  name: 'firstName',
  type: 'text',
  label: 'First Name',
  placeholder: 'John'
}
```

#### Email Input

```typescript
// More explicit type
{
  name: 'email',
  type: 'email',  // Was: type: 'text', props: { type: 'email' }
  label: 'Email',
  placeholder: 'john@example.com'
}
```

#### Number Input

```typescript
// More explicit type
{
  name: 'age',
  type: 'number',  // Was: type: 'text', props: { type: 'number' }
  label: 'Age'
}
```

#### Select Field

```typescript
// Same structure, improved styling
{
  name: 'country',
  type: 'select',
  label: 'Country',
  options: [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' }
  ]
}
```

#### File Upload

```typescript
{
  name: 'documents',
  type: 'file',
  label: 'Upload Documents',
  props: {
    accept: '.pdf,.doc,.docx',
    multiple: true
  }
}
```

### Step 4: Update Custom Props

If you pass custom HTML attributes via `props`, they still work:

```typescript
{
  name: 'phone',
  type: 'text',
  label: 'Phone',
  props: {
    'data-testid': 'phone-input',  // Still works
    disabled: false                 // Still works
  }
}
```

## What Doesn't Change

✅ Form validation logic  
✅ Field-level error handling  
✅ Submit function signatures  
✅ Zod schema validation  
✅ Field dependencies and conditionals

## Testing Your Migration

After migrating, test:

1. **Styling** - Fields should be full width and properly spaced
2. **Focus states** - Blue border on focus
3. **Error display** - Red error text below each field
4. **Size consistency** - All fields should have same height
5. **Disabled state** - Grayed out fields should be visually distinct
6. **Validation** - Error messages still appear correctly

## Backward Compatibility

The mapping in `Form.vue` maintains backward compatibility:

- `type: 'text'` routes to `InputTextField`
- `type: 'password'` routes to `PasswordTextField`
- Other types work as before

Existing forms will continue to work without changes, but will automatically get the improved styling.

## Common Issues & Solutions

### Issue: Fields don't look different after migration

**Solution:** Make sure to rebuild the project. The Form.vue imports have changed and might need a full refresh.

```bash
npm run build
# or for dev
npm run dev
```

### Issue: Custom styling not applying

**Solution:** Check that you're not overriding the new field component styles. The new components have scoped styles that take precedence.

### Issue: PrimeVue styling still visible

**Solution:** Make sure the old PrimeVue imports are removed from Form.vue. Check the imports at the top of the file.

## Examples of Updated Forms

### Login Form

```typescript
const fields: FieldDef[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email Address',
    validateOnBlur: true,
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    validateOnInput: true,
  },
]
```

### User Registration

```typescript
const fields: FieldDef[] = [
  {
    name: 'firstName',
    type: 'text',
    label: 'First Name',
  },
  {
    name: 'lastName',
    type: 'text',
    label: 'Last Name',
  },
  {
    name: 'email',
    type: 'email',
    label: 'Email',
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
  },
  {
    name: 'agreeToTerms',
    type: 'checkbox',
    label: 'I agree to the terms and conditions',
  },
  {
    name: 'countryCode',
    type: 'select',
    label: 'Country',
    options: countryList,
  },
]
```

### MPA Form

```typescript
const fields: FieldDef[] = [
  {
    name: 'name',
    type: 'text',
    label: 'MPA Name',
  },
  {
    name: 'description',
    type: 'text',
    label: 'Description',
  },
  {
    name: 'designation',
    type: 'select',
    label: 'Designation',
    options: designationOptions,
  },
  {
    name: 'documentation',
    type: 'file',
    label: 'Upload Documentation',
    props: { multiple: true, accept: '.pdf' },
  },
  {
    name: 'isActive',
    type: 'switch',
    label: 'Active MPA',
  },
]
```

## Performance Notes

The new field components are optimized for performance:

- No unnecessary re-renders
- Direct event emission
- Minimal computed properties
- Efficient CSS scoping

No performance regressions expected; may see slight improvements in complex forms.
