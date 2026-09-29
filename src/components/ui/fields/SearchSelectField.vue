<template>
  <div class="searchselect-field">
    <label v-if="label" :for="id" class="field-label">{{ label }}</label>
    <Select
      :id="id"
      :model-value="modelValue"
      :options="normalizedOptions"
      option-label="label"
      option-value="value"
      filter
      :auto-filter-focus="true"
      filter-placeholder="Type to search..."
      :placeholder="placeholder || 'Select an option...'"
      class="field-select"
      v-bind="$attrs"
      @update:model-value="handleChange"
    />
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Select from 'primevue/select';

interface OptionObject {
  value?: string | number;
  label?: string;
  [key: string]: any;
}

type OptionType = string | number | OptionObject;

const props = defineProps({
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
}>();

// Support both plain string/number options and { label, value } objects
const normalizedOptions = computed(() =>
  props.options.map((opt) => {
    if (typeof opt === 'object') {
      return { ...opt, label: String(opt.label ?? opt.value ?? ''), value: opt.value ?? '' };
    }
    return { label: String(opt), value: opt };
  })
);

const handleChange = (value: string | number) => {
  emit('update:modelValue', value);
};
</script>

<style scoped>
.searchselect-field {
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
}

.field-error {
  font-size: 0.875rem;
  color: #dc2626;
  margin: 0;
}
</style>
