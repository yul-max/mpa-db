import { ref } from 'vue';

/**
 * Global navigation loading state, toggled by router hooks in @/router.
 * Used to show a progress indicator while pages (lazy chunks/guards) load.
 */
const isNavigating = ref(false);

export function useNavigationLoading() {
  return { isNavigating };
}
