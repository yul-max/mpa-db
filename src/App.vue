<template>
<router-view />
<ToastContainer />
</template>


<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// Verify authentication on app startup
onMounted(async () => {
  await authStore.verifyAuth()
})

// If the session ends (logout or expired token) while on a protected route,
// redirect to the dashboard immediately.
watch(() => authStore.isAuthenticated, (authenticated) => {
  if (!authenticated && route.meta.requiresAuth) {
    router.push({ name: 'dashboard' })
  }
})
</script>
