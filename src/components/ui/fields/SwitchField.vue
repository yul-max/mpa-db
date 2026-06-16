<template>
  <div class="switch-field">
    <div class="switch-wrapper">
      <label v-if="label" :for="id" class="field-label">{{ label }}</label>
      <input
        :id="id"
        :checked="modelValue"
        type="checkbox"
        role="switch"
        :aria-checked="modelValue"
        class="field-switch"
        v-bind="$attrs"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
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
.switch-field {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.375rem;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.field-switch {
  position: relative;
  width: 2.5rem;
  height: 1.5rem;
  appearance: none;
  background-color: #d1d5db;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  transition: background-color 0.3s;
  flex-shrink: 0;
}

.field-switch::before {
  content: '';
  position: absolute;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background-color: white;
  top: 0.125rem;
  left: 0.125rem;
  transition: left 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.field-switch:checked {
  background-color: #3b82f6;
}

.field-switch:checked::before {
  left: 1.125rem;
}

.field-switch:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-switch:disabled {
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
