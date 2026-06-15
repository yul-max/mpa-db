<template>
  <div class="password-text-field">
    <label v-if="label" class="field-label">{{ label }}</label>
    <div class="password-input-wrapper">
      <input
        :value="modelValue"
        :type="showPassword ? 'text' : 'password'"
        v-bind="$attrs"
        class="field-input"
        @input="handleInput($event)"
      />
      <button
        type="button"
        class="toggle-password"
        @click="showPassword = !showPassword"
        :aria-label="showPassword ? 'Hide password' : 'Show password'"
      >
        <span v-if="showPassword">✕</span>
        <span v-else>•</span>
      </button>
    </div>
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps({
  modelValue: [String, Number],
  label: String,
  error: String
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
}>();

const showPassword = ref(false);

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<style scoped>
.password-text-field {
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

.password-input-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.field-input {
  width: 100%;
  padding: 0.5rem 2rem 0.5rem 0.75rem;
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

.toggle-password {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  color: #6b7280;
  font-size: 1.25rem;
  transition: color 0.2s;
}

.toggle-password:hover {
  color: #1f2937;
}

.field-error {
  font-size: 0.875rem;
  color: #dc2626;
  margin: 0;
}
</style>
