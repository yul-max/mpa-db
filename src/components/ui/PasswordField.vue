<template>
  <div class="password-field">
    <label v-if="label" class="field-label">{{ label }}</label>
    <InputTextPrime
      :value="modelValue"
      :id="id"
      :placeholder="placeholder"
      :type="type || 'password'"
      @input="onInput"
      @focus="onFocus"
      class="password-input"
    />
    <ul v-if="touched && !allOk" class="pw-criteria">
      <li :class="{ ok: hasMin }">{{ hasMin ? '✓' : '✗' }} At least 8 characters</li>
      <li :class="{ ok: hasUpper }">{{ hasUpper ? '✓' : '✗' }} One uppercase letter</li>
      <li :class="{ ok: hasLower }">{{ hasLower ? '✓' : '✗' }} One lowercase letter</li>
      <li :class="{ ok: hasNumber }">{{ hasNumber ? '✓' : '✗' }} One number</li>
      <li :class="{ ok: hasSymbol }">{{ hasSymbol ? '✓' : '✗' }} One symbol</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import InputTextPrime from 'primevue/inputtext';

const props = defineProps<{
  modelValue: string;
  id?: string;
  label?: string;
  placeholder?: string;
  type?: string;
}>();
const emit = defineEmits(['update:modelValue', 'input']);

const hasMin = computed(() => (props.modelValue || '').length >= 8);
const hasUpper = computed(() => /[A-Z]/.test(props.modelValue || ''));
const hasLower = computed(() => /[a-z]/.test(props.modelValue || ''));
const hasNumber = computed(() => /[0-9]/.test(props.modelValue || ''));
const hasSymbol = computed(() => /[^A-Za-z0-9]/.test(props.modelValue || ''));
const touched = ref(false);
const allOk = computed(() => hasMin.value && hasUpper.value && hasLower.value && hasNumber.value && hasSymbol.value);

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  touched.value = true;
  emit('update:modelValue', target.value);
  emit('input', e);
};

const onFocus = () => {
  touched.value = true;
};
</script>

<style scoped>
.password-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.field-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
}
.pw-criteria {
  list-style: none;
  margin: 0.5rem 0 0 0;
  padding: 0;
  font-size: 0.85rem;
  color: #6b7280; /* gray-500 */
}
.pw-criteria li {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.pw-criteria li.ok {
  color: #16a34a; /* green-600 */
}
.password-input :deep(.p-inputtext) {
  width: 100%;
}
</style>
