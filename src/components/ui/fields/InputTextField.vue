<template>
  <div class="input-text-field">
    <label v-if="label" :for="fieldId" class="field-label">{{ label }}</label>
    <input
      :id="fieldId"
      :name="name || id || fieldId"
      :value="modelValue"
      :autocomplete="autocomplete"
      v-bind="$attrs"
      class="field-input"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  id: String,
  name: String,
  modelValue: [String, Number],
  label: String,
  error: String,
  autocomplete: String
});

const fieldId = computed(() => props.id || props.name || `field-${Math.random().toString(36).substring(2, 9)}`);

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
}>();
</script>

<style scoped>
.input-text-field {
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

.field-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.field-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-input:disabled {
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
