<template>
  <div v-if="isOpen" class="user-menu-overlay" @click="closeMenu"></div>
  <div :class="['user-menu', { 'menu-open': isOpen }]">
    <div class="menu-content">
      <button class="logout-button" @click="handleLogout">
        <FontAwesomeIcon :icon="['fas', 'sign-out-alt']" />
        <span>Log Out</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const isOpen = ref(false)

const closeMenu = () => {
  isOpen.value = false
}

const openMenu = () => {
  isOpen.value = true
}

const handleLogout = async () => {
  await authStore.logout()
  closeMenu()
  router.push('/mpa')
}

defineExpose({ openMenu, closeMenu })
</script>

<style scoped>
.user-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: transparent;
  z-index: 999;
}

.user-menu {
  position: fixed;
  top: 72px;
  right: 0;
  background: white;
  box-shadow: -2px 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  padding: 1rem;
  width: 200px;
  border-radius: 0 0 0.375rem 0.375rem;
  transform: scaleY(0);
  transform-origin: top right;
  transition: transform 0.15s ease-out;
}

.user-menu.menu-open {
  transform: scaleY(1);
}

.menu-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #333;
  font-size: 0.875rem;
  transition: background-color 0.15s ease;
}

.logout-button:hover {
  background-color: #f3f4f6;
}

.logout-button span {
  flex: 1;
  text-align: left;
}
</style>
