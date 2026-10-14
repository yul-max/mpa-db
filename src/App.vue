<template>
<router-view />
<ToastContainer />
</template>


<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ToastContainer from '@/components/ui/ToastContainer.vue'

const authStore = useAuthStore()

// Verify authentication on app startup
onMounted(async () => {
  await authStore.verifyAuth()
})
</script>
