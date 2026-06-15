<template>
  <div class="checkbox-field">
    <div class="checkbox-wrapper">
      <input
        :id="id"
        :checked="modelValue"
        type="checkbox"
        class="field-checkbox"
        v-bind="$attrs"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <label v-if="label" :for="id" class="field-label">{{ label }}</label>
    </div>
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps({
  id: String,
  modelValue: Boolean,
  label: String,
  error: String
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>

<style scoped>
.checkbox-field {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.375rem;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-checkbox {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  accent-color: #3b82f6;
  border-radius: 0.25rem;
}

.field-checkbox:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-checkbox:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  cursor: pointer;
}

.field-error {
  font-size: 0.875rem;
  color: #dc2626;
  margin: 0;
}
</style>
