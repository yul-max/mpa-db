<template>
  <div class="flex flex-col h-screen bg-gray-50">
    <div v-if="isNavigating" class="route-progress" aria-hidden="true">
      <div class="route-progress-bar" />
    </div>
    <header class="bg-white border-b p-4 shrink-0"><AppHeader /></header>
    <main class="flex-1 overflow-auto">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppHeader from '@/components/ui/AppHeader.vue';
import { useAuthStore } from '@/stores/auth';
import { useNavigationLoading } from '@/composables/useNavigationLoading';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { isNavigating } = useNavigationLoading();

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

<style scoped>
/* Top progress bar shown while a navigation is in flight */
.route-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 2000;
  overflow: hidden;
  background: rgba(14, 165, 233, 0.15);
  /* Fade in slightly delayed so instant navigations don't flash the bar */
  opacity: 0;
  animation: route-progress-appear 0.15s ease-out 0.1s forwards;
}

.route-progress-bar {
  height: 100%;
  width: 40%;
  background: linear-gradient(90deg, #38bdf8, #0ea5e9);
  border-radius: 9999px;
  animation: route-progress-slide 1s ease-in-out infinite;
}

@keyframes route-progress-appear {
  to {
    opacity: 1;
  }
}

@keyframes route-progress-slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(250%);
  }
}
</style>

<style>
/* Page fade transition between routes (global: applied to route components) */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.15s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
