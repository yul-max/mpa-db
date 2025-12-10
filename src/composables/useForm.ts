import { ref, computed, watch } from 'vue';
import { z } from 'zod';

export function useForm<T extends Record<string, any>>(
  schema: z.ZodSchema,
  initialValues: T,
  options?: {
    validateOnBlur?: boolean;
    validateOnChange?: boolean;
  }
) {
  const payload = ref<T>(JSON.parse(JSON.stringify(initialValues)));
  const errors = ref<Partial<Record<keyof T, string>>>({});
  const touched = ref<Partial<Record<keyof T, boolean>>>({});
  const isSubmitting = ref(false);

  const isFormValid = computed(() => {
    try {
      schema.parse(payload.value);
      return true;
    } catch {
      return false;
    }
  });

  const validateField = (field: keyof T) => {
    touched.value[field] = true;
    try {
      if (schema instanceof z.ZodObject) {
        const zodObject = schema as z.ZodObject<Record<string, z.ZodTypeAny>>;
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

  const validateForm = (): boolean => {
    errors.value = {};
    try {
      schema.parse(payload.value);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((err: z.ZodIssue) => {
          const field = err.path[0] as keyof T;
          errors.value[field] = err.message;
        });
      }
      return false;
    }
  };

  const resetForm = () => {
    payload.value = JSON.parse(JSON.stringify(initialValues));
    errors.value = {};
    touched.value = {};
  };

  const setFieldValue = (field: keyof T, value: any) => {
    payload.value[field] = value;
    if (options?.validateOnChange) {
      validateField(field);
    }
  };

  const setFieldError = (field: keyof T, error: string) => {
    errors.value[field] = error;
  };

  watch(
    () => payload.value,
    (newValue) => {
      // Optional: auto-validate on change if enabled
      if (options?.validateOnChange) {
        validateForm();
      }
    },
    { deep: true }
  );

  return {
    payload,
    errors,
    touched,
    isFormValid,
    isSubmitting,
    validateField,
    validateForm,
    resetForm,
    setFieldValue,
    setFieldError
  };
}
