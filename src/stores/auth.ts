import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as authApi from '@/api/auth';


export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null);
  const accessToken = ref<string | null>(null);


  const isAuthenticated = computed(() => !!accessToken.value);


  async function login(identifier: string, password: string) {
    const resp = await authApi.login(identifier, password);
    accessToken.value = resp.data.accessToken;
    user.value = resp.data.user;
  }


  async function logout() {
    await authApi.logout();
    accessToken.value = null;
    user.value = null;
  }


  function setAccessToken(t: string) { accessToken.value = t; }
  return { user, accessToken, isAuthenticated, login, logout, setAccessToken };
});
