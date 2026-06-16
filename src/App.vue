<template>
<router-view />
</template>


<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Verify authentication on app startup
onMounted(async () => {
  await authStore.verifyAuth()
})
</script>
