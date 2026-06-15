<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <header class="bg-white border-b p-4 shrink-0"><AppHeader /></header>
    <main class="flex-1 overflow-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '@/components/ui/AppHeader.vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

watch(
  () => [authStore.user, authStore.isAuthenticated, route.meta.requiresAuth],
  () => {
    if (route.meta.requiresAuth && (!authStore.user || !authStore.isAuthenticated)) {
      router.push({ name: 'dashboard' });
    }
  },
  { immediate: true }
);
</script>
