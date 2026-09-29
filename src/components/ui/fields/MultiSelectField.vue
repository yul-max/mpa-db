<template>
  <div class="multiselect-field">
    <label v-if="label" :for="id" class="field-label">{{ label }}</label>
    <MultiSelect
      :id="id"
      :model-value="modelValue"
      :options="options"
      option-label="label"
      option-value="value"
      display="chip"
      filter
      :auto-filter-focus="true"
      filter-placeholder="Type to search..."
      :show-toggle-all="false"
      :placeholder="placeholder || 'Select options...'"
      class="field-multiselect"
      v-bind="$attrs"
      @update:model-value="handleChange"
    />
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import MultiSelect from 'primevue/multiselect';

interface OptionObject {
  value?: string | number;
  label?: string;
  [key: string]: any;
}

defineProps({
  id: String,
  modelValue: {
    type: Array as () => Array<string | number>,
    default: () => []
  },
  label: String,
  placeholder: String,
  options: {
    type: Array as () => OptionObject[],
    default: () => []
  },
  error: String
});

const emit = defineEmits<{
  'update:modelValue': [value: Array<string | number>];
}>();

const handleChange = (value: Array<string | number>) => {
  emit('update:modelValue', value ?? []);
};
</script>

<style scoped>
.multiselect-field {
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

.field-multiselect {
  width: 100%;
}

.field-error {
  font-size: 0.875rem;
  color: #dc2626;
  margin: 0;
}
</style>
