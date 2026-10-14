import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastOptions {
  title?: string;
  /** Auto-dismiss delay in ms. Pass 0 to keep the toast until manually dismissed. */
  duration?: number;
}

const DEFAULT_DURATION = 5000;

const toasts = ref<Toast[]>([]);
let nextId = 0;

const dismiss = (id: number) => {
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
};

const show = (type: ToastType, message: string, options?: ToastOptions) => {
  const id = ++nextId;
  toasts.value.push({ id, type, message, title: options?.title });

  const duration = options?.duration ?? DEFAULT_DURATION;
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }

  return id;
};

export function useToast() {
  return {
    toasts,
    dismiss,
    success: (message: string, options?: ToastOptions) => show('success', message, options),
    error: (message: string, options?: ToastOptions) => show('error', message, options),
    info: (message: string, options?: ToastOptions) => show('info', message, options),
    warning: (message: string, options?: ToastOptions) => show('warning', message, options)
  };
}
