<template>
  <div v-if="open" class="confirm-overlay" @click.self="emit('cancel')">
    <div class="confirm-card">
      <h3 class="confirm-title">{{ title }}</h3>
      <p class="confirm-message">{{ message }}</p>
      <slot name="content"></slot>
      <div class="confirm-actions">
        <button
          v-if="cancelLabel"
          type="button"
          class="secondary-button"
          @click="emit('cancel')"
        >
          {{ cancelLabel }}
        </button>
        <button
          type="button"
          class="primary-button"
          :disabled="disableConfirm"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    disableConfirm?: boolean;
  }>(),
  {
    title: 'Discard changes?',
    message: 'You have unsaved changes. Are you sure you want to leave? ',
    confirmLabel: 'Discard',
    cancelLabel: 'Keep editing',
    disableConfirm: false
  }
);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.confirm-card {
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: min(90vw, 420px);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.confirm-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
}

.confirm-message {
  color: #475569;
  font-size: 0.95rem;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.secondary-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: transparent;
  color: #374151;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.secondary-button:hover {
  color: #111827;
  border-color: #9ca3af;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #2563eb;
  color: white;
  border-radius: 0.375rem;
  border: none;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.primary-button:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
