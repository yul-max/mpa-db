<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast-${toast.type}`"
          role="status"
        >
          <span class="toast-icon" aria-hidden="true">
            <svg v-if="toast.type === 'success'" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg v-else-if="toast.type === 'error'" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <svg v-else-if="toast.type === 'warning'" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <svg v-else viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </span>
          <div class="toast-body">
            <p v-if="toast.title" class="toast-title">{{ toast.title }}</p>
            <p class="toast-message">{{ toast.message }}</p>
          </div>
          <button type="button" class="toast-close" aria-label="Dismiss" @click="dismiss(toast.id)">
            &times;
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast';

const { toasts, dismiss } = useToast();
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.5rem;
  width: min(92vw, 360px);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.75rem 0.875rem;
  background: #ffffff;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  border-left-width: 4px;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  pointer-events: auto;
}

.toast-success {
  border-left-color: #16a34a;
}

.toast-error {
  background: #dc2626;
  border-color: #b91c1c;
  border-left-color: #7f1d1d;
  box-shadow: 0 10px 15px rgba(220, 38, 38, 0.35), 0 4px 6px rgba(0, 0, 0, 0.1);
}

.toast-warning {
  border-left-color: #d97706;
}

.toast-info {
  border-left-color: #2563eb;
}

.toast-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.0625rem;
}

.toast-icon svg {
  width: 100%;
  height: 100%;
}

.toast-success .toast-icon {
  color: #16a34a;
}

.toast-error .toast-icon {
  color: #ffffff;
}

.toast-warning .toast-icon {
  color: #d97706;
}

.toast-info .toast-icon {
  color: #2563eb;
}

.toast-body {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 0.125rem;
}

.toast-message {
  font-size: 0.875rem;
  color: #334155;
  margin: 0;
  overflow-wrap: break-word;
}

.toast-error .toast-title,
.toast-error .toast-message {
  color: #ffffff;
}

.toast-error .toast-close {
  color: rgba(255, 255, 255, 0.75);
}

.toast-error .toast-close:hover {
  color: #ffffff;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0;
  margin-top: -0.125rem;
  font-size: 1.125rem;
  line-height: 1;
  color: #94a3b8;
  cursor: pointer;
}

.toast-close:hover {
  color: #475569;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(0.75rem);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

.toast-move {
  transition: transform 0.25s ease;
}
</style>
