import { useAuthStore } from '@/stores/auth';
export function useCan() {
  const auth = useAuthStore();
  function can(permission: string) {
    const role = auth.user?.role;
    if (role === 'admin') return true;
    if (role === 'contributor') return ['mpa:create', 'mpa:edit-own'].includes(permission);
    return false;
  }
  return { can };
}
