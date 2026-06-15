<template>
  <form @submit.prevent="handleSubmit" class="form-wrapper">
    <template v-if="props.fields && props.fields.length">
      <div class="form-content">
        <div class="form-fields">
          <div v-for="field in props.fields" :key="field.name" class="form-field">
            <component
              :is="resolveComponent(field)"
              v-model="(payload as any)[field.name]"
              :id="field.name"
              v-bind="componentAttrs(field)"
              @blur="onFieldBlur(field)"
              @input="onFieldInput(field)"
              :class="{
                'field-invalid': (touched as any)[field.name] && (errors as any)[field.name],
                'field-valid': (touched as any)[field.name] && !(errors as any)[field.name]
              }"
            >
            </component>
            <div v-if="(touched as any)[field.name] && (errors as any)[field.name]" class="error-message">{{ (errors as any)[field.name] }}</div>

            <!-- Confirm password live match indicator (signup form) -->
            <div v-if="field.name === 'confirmPassword'" class="match-indicator">
              <template v-if="(touched as any)[field.name] && ((payload as any).password || (payload as any).confirmPassword)">
                <span v-if="(payload as any).password === (payload as any).confirmPassword" class="match-ok">✓ Passwords match</span>
                <span v-else class="match-bad">✗ Passwords do not match</span>
              </template>
            </div>
          </div>
        </div>
        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>
        <div
          class="form-buttons"
          :class="[
            `align-${props.buttonAlign}`,
            props.buttonFill && props.cancelLabel ? 'fill' : ''
          ]"
        >
          <button
            type="submit"
            class="btn-submit"
            :class="props.buttonFill && 'w-full'"
            :disabled="!isFormValid || (props.submit && loading)"
          >
            {{ props.submitLabel }}
          </button>
          <button
            v-if="props.cancelLabel"
            type="button"
            class="btn-cancel"
            :class="props.buttonFill && 'w-full'"
            @click="handleCancel"
            :disabled="props.submit && loading"
          >
            {{ props.cancelLabel }}
          </button>
        </div>
      </div>
    </template>
    <template v-else>
      <slot :payload="payload" :errors="errors" :isFormValid="isFormValid" :validateField="validateField" />
    </template>

    <!-- Form errors summary removed; errors are shown under each field -->
  </form>
</template>

<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed, watch } from 'vue';
import { z } from 'zod';
import { clearFormValues } from '@/utils/formHelpers';
import type { FieldDef, SubmitFunction, OnSuccessCallback } from '@/types/forms';
import InputTextField from './fields/InputTextField.vue';
import PasswordTextField from './fields/PasswordTextField.vue';
import DropdownField from './fields/DropdownField.vue';
import CheckboxField from './fields/CheckboxField.vue';
import SwitchField from './fields/SwitchField.vue';
import FileUploadField from './fields/FileUploadField.vue';

const props = withDefaults(
    defineProps<{
    schema: z.ZodSchema;
    initialValues: T;
    fields?: FieldDef[];
    submitLabel?: string;
    cancelLabel?: string;
    buttonAlign?: 'left' | 'right' | 'center';
    buttonFill?: boolean;
    submit?: SubmitFunction;
    onSuccess?: OnSuccessCallback;
    clearOnCancel?: boolean;
  }>(),
  {
    submitLabel: 'Submit',
    buttonAlign: 'left',
    buttonFill: false,
    clearOnCancel: false
  }
);

const emit = defineEmits<{
  submit: [values: T];
  error: [errors: Partial<Record<keyof T, string>>];
  cancel: [];
  fieldChange: [fieldName: string, value: unknown, payload: T];
}>();

const payload = ref<T>(JSON.parse(JSON.stringify(props.initialValues)));
const errors = ref<Partial<Record<keyof T, string>>>({});
const touched = ref<Partial<Record<keyof T, boolean>>>({});
const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// Watch for external changes to initialValues
watch(
  () => props.initialValues,
  (newValues) => {
    payload.value = JSON.parse(JSON.stringify(newValues));
  },
  { deep: true }
);

// Watch for changes to payload and emit fieldChange events
watch(
  payload,
  (newPayload, oldPayload) => {
    if (oldPayload) {
      // Find which field changed
      for (const key in newPayload) {
        if (newPayload[key] !== oldPayload[key]) {
          emit('fieldChange', key, newPayload[key], newPayload);
        }
      }
    }
  },
  { deep: true }
);

const isFormValid = computed(() => {
  // Check if form is empty (all fields are their initial values)
  const isEmpty = Object.keys(props.initialValues).every(
    (key) => payload.value[key] === props.initialValues[key]
  );

  if (isEmpty) {
    return false;
  }

  try {
    props.schema.parse(payload.value);
    return true;
  } catch {
    return false;
  }
});

const clearMessages = () => {
  successMessage.value = '';
  errorMessage.value = '';
};

const validateField = (field: keyof T) => {
  touched.value[field] = true;
  try {
    if (props.schema instanceof z.ZodObject) {
      const zodObject = props.schema as z.ZodObject<Record<string, z.ZodTypeAny>>;
      const fieldSchema = zodObject.pick({ [field]: true } as Record<string, true>);
      fieldSchema.parse({ [field]: payload.value[field] });
    }
    delete errors.value[field];
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.value[field] = error.issues[0]?.message || 'Validation error';
    }
  }
};

const onFieldBlur = (field: FieldDef) => {
  if (field.validateOnBlur) {
    validateField(field.name as keyof T);
  }
};

const onFieldInput = (field: FieldDef) => {
  clearMessages();
  if (field.validateOnInput) {
    validateField(field.name as keyof T);
  }
  // Emit field change event for parent components to react to
  const fieldValue = payload.value[field.name as keyof T];
  emit('fieldChange', field.name, fieldValue, payload.value);
};

const validateForm = (): boolean => {
  errors.value = {};
  try {
    props.schema.parse(payload.value);
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.issues.forEach((err: z.ZodIssue) => {
        const field = err.path[0] as keyof T;
        errors.value[field] = err.message;
        touched.value[field] = true;
      });
    }
    return false;
  }
};

const handleSubmit = async () => {
  if (!validateForm()) {
    emit('error', errors.value);
    return;
  }

  // If a submit function was provided, use it
  if (props.submit) {
    loading.value = true;
    clearMessages();
    try {
      const result = await props.submit(payload.value);
      if (result.success) {
        successMessage.value = result.message || 'Success!';
        // Call the onSuccess callback if provided
        if (props.onSuccess) {
          await props.onSuccess();
          payload.value = clearFormValues(payload.value);
        }
      } else {
        errorMessage.value = result.message || 'An error occurred.';
      }
    } catch (error) {
      errorMessage.value = 'An unexpected error occurred.';
      console.error('Submit error:', error);
    } finally {
      loading.value = false;
    }
  } else {
    // Otherwise emit the submit event (backwards compatibility)
    emit('submit', payload.value);
  }
};

const handleCancel = () => {
  if (props.clearOnCancel) {
    payload.value = clearFormValues(payload.value);
    errors.value = {};
    touched.value = {};
  }
  emit('cancel');
};

const componentMap: Record<string, unknown> = {
  text: InputTextField,
  email: InputTextField,
  number: InputTextField,
  password: PasswordTextField,
  select: DropdownField,
  file: FileUploadField,
  checkbox: CheckboxField,
  switch: SwitchField
};

const resolveComponent = (field: FieldDef) => {
  // Custom component takes precedence
  if (field.component) return field.component;

  // Map field type to form field component
  // Note: Form field types ('text', 'email', 'select', etc.) are different from
  // table column types ('string', 'number', 'boolean', etc.)
  const component = (componentMap as Record<string, unknown>)[field.type ?? ''];

  // Return component if found, otherwise default to InputTextField for unknown types
  return component || InputTextField;
};

const componentAttrs = (field: FieldDef) => {
  const base: Record<string, unknown> = { ...(field.props || {}) };

  // Ensure id is available for label binding
  base.id = field.name;

  if (field.label) base.label = field.label;
  if (field.placeholder) base.placeholder = field.placeholder;
  if (field.options) base.options = field.options;

  // Handle disabled as either boolean or function
  if (field.disabled) {
    const disabled = typeof field.disabled === 'function' ? field.disabled(payload.value) : field.disabled;
    base.disabled = disabled;
  }

  // Allow custom type from props (e.g., type: 'number')
  if (field.props?.type && field.type === 'text') {
    base.type = field.props.type;
  }

  return base;
};

// Expose methods to parent
defineExpose({
  payload,
  errors,
  isFormValid,
  validateField,
  validateForm,
  handleSubmit,
  clearMessages
});
</script>

<style scoped>
.form-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-buttons {
  display: flex;
  gap: 1rem;
  width: 100%;
}
.form-buttons.align-left {
  justify-content: flex-start;
}
.form-buttons.align-right {
  justify-content: flex-end;
}
.form-buttons.align-center {
  justify-content: center;
}
.form-buttons.fill {
  width: 100%;
}

.btn-submit,
.btn-cancel {
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-submit {
  background-color: #007bff;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-submit:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-cancel {
  background: none;
  border: 2px solid #007bff;
  color: #007bff;
}

.btn-cancel:hover {
  border-color: #0056b3;
  color: #0056b3;
}

.match-indicator {
  margin-top: 0.375rem;
  font-size: 0.9rem;
}
.match-ok {
  color: #16a34a; /* green-600 */
}
.match-bad {
  color: #ef4444; /* red-500 */
}

.form-errors {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fee;
  border: 1px solid #fcc;
  border-radius: 0.25rem;
}

.error-message {
  color: #c33;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.error-message:last-child {
  margin-bottom: 0;
}

.alert {
  padding: 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid transparent;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
}
</style>
