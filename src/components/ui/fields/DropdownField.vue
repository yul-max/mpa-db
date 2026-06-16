<template>
  <div class="select-field">
    <label v-if="label" :for="id" class="field-label">{{ label }}</label>
    <select
      :id="id"
      :value="modelValue"
      v-bind="$attrs"
      class="field-select"
      @change="handleChange"
    >
      <option value="" disabled>{{ placeholder || 'Select an option...' }}</option>
      <option v-for="(opt, idx) in options" :key="getOptionKey(opt, idx)" :value="getOptionValue(opt)">
        {{ getOptionLabel(opt) }}
      </option>
    </select>
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
interface OptionObject {
  value?: string | number;
  label?: string;
  [key: string]: any;
}

type OptionType = string | number | OptionObject;

defineProps({
  id: String,
  modelValue: [String, Number],
  label: String,
  placeholder: String,
  options: {
    type: Array as () => OptionType[],
    default: () => []
  },
  error: String
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  'input': [event: Event];
}>();

const handleChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  emit('update:modelValue', value);
  emit('input', event);
};

const getOptionKey = (opt: OptionType, idx: number): string | number => {
  if (typeof opt === 'object') {
    return (opt as OptionObject).value ?? idx;
  }
  return opt;
};

const getOptionValue = (opt: OptionType): string | number => {
  if (typeof opt === 'object') {
    return (opt as OptionObject).value ?? '';
  }
  return opt;
};

const getOptionLabel = (opt: OptionType): string => {
  if (typeof opt === 'object') {
    return String((opt as OptionObject).label ?? (opt as OptionObject).value ?? '');
  }
  return String(opt);
};
</script>

<style scoped>
.select-field {
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

.field-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2rem;
}

.field-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-select:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.field-error {
  font-size: 0.875rem;
  color: #dc2626;
  margin: 0;
}
</style>
