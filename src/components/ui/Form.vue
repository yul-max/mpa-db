<template>
  <form @submit.prevent="handleSubmit" class="form-wrapper">
    <template v-if="props.fields && props.fields.length">
      <div class="form-content">
        <div class="form-fields">
          <div v-for="field in props.fields" :key="field.name" class="form-field">
            <label v-if="field.label" :for="field.name">{{ field.label }}</label>
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
            :disabled="!isFormValid"
          >
            {{ props.submitLabel }}
          </button>
          <button
            v-if="props.cancelLabel"
            type="button"
            class="btn-cancel"
            :class="props.buttonFill && 'w-full'"
            @click="handleCancel"
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
import InputTextPrime from 'primevue/inputtext';
import DropdownPrime from 'primevue/dropdown';
import CheckboxPrime from 'primevue/checkbox';
import FileUploadPrime from 'primevue/fileupload';

type FieldDef = {
  name: string;
  label?: string;
  type?: 'text' | 'password' | 'select' | 'checkbox' | 'file';
  component?: unknown; // optional override component
  options?: string[];
  placeholder?: string;
  props?: Record<string, unknown>;
  validateOnBlur?: boolean;
  validateOnInput?: boolean;
};

const props = withDefaults(
    defineProps<{
    schema: z.ZodSchema;
    initialValues: T;
    fields?: FieldDef[];
    submitLabel?: string;
    cancelLabel?: string;
    buttonAlign?: 'left' | 'right' | 'center';
    buttonFill?: boolean;
  }>(),
  {
    submitLabel: 'Submit',
    buttonAlign: 'left',
    buttonFill: false
  }
);

const emit = defineEmits<{
  submit: [values: T];
  error: [errors: Partial<Record<keyof T, string>>];
  cancel: [];
}>();

const payload = ref<T>(JSON.parse(JSON.stringify(props.initialValues)));
const errors = ref<Partial<Record<keyof T, string>>>({});
const touched = ref<Partial<Record<keyof T, boolean>>>({});

// Watch for external changes to initialValues
watch(
  () => props.initialValues,
  (newValues) => {
    payload.value = JSON.parse(JSON.stringify(newValues));
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
  if (field.validateOnInput) {
    validateField(field.name as keyof T);
  }
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

const handleSubmit = () => {
  if (validateForm()) {
    emit('submit', payload.value);
  } else {
    emit('error', errors.value);
  }
};

const handleCancel = () => {
  emit('cancel');
};

// (file inputs are handled via FileUpload component by default)

const componentMap: Record<string, unknown> = {
  text: InputTextPrime,
  password: InputTextPrime,
  select: DropdownPrime,
  file: FileUploadPrime,
  checkbox: CheckboxPrime
};

const resolveComponent = (field: FieldDef) => {
  if (field.component) return field.component;
  return (componentMap as Record<string, unknown>)[field.type ?? ''] || 'input';
};

const componentAttrs = (field: FieldDef) => {
  const base: Record<string, unknown> = { ...(field.props || {}) };
  if (field.type === 'password') (base as Record<string, unknown>).type = 'password';
  if (field.placeholder) (base as Record<string, unknown>).placeholder = field.placeholder;
  if (field.options) (base as Record<string, unknown>).options = field.options;
  if (field.label) (base as Record<string, unknown>).label = field.label;
  return base;
};

// Expose methods to parent
defineExpose({
  payload,
  errors,
  isFormValid,
  validateField,
  validateForm,
  handleSubmit
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
  margin-top: 1.5rem;
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
</style>
