<template>
  <button
    class="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-sm cursor-pointer transition-colors duration-150"
    :title="fullName"
    @click="$emit('click')"
  >
    {{ initials }}
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const initials = computed(() => {
  const firstName = authStore.user?.user_name || ''
  const lastName = authStore.user?.last_name || ''
  const first = firstName.charAt(0).toUpperCase()
  const last = lastName.charAt(0).toUpperCase()
  return (first + last).slice(0, 2) || '?'
})

const fullName = computed(() => {
  const firstName = authStore.user?.firstName || ''
  const lastName = authStore.user?.lastName || ''
  return `${firstName} ${lastName}`.trim()
})
</script>
