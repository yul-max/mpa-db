// Export all form field components for easy importing
export { default as InputTextField } from './InputTextField.vue';
export { default as PasswordTextField } from './PasswordTextField.vue';
export { default as DropdownField } from './DropdownField.vue';
export { default as CheckboxField } from './CheckboxField.vue';
export { default as SwitchField } from './SwitchField.vue';
export { default as FileUploadField } from './FileUploadField.vue';

// Export a registry for dynamic field resolution
export const fieldComponentRegistry = {
  text: 'InputTextField',
  password: 'PasswordTextField',
  email: 'InputTextField',
  number: 'InputTextField',
  select: 'DropdownField',
  checkbox: 'CheckboxField',
  switch: 'SwitchField',
  file: 'FileUploadField'
};

export type FieldType = keyof typeof fieldComponentRegistry;
