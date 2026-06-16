<template>
  <div v-if="isOpen" class="login-drawer-overlay" @click="closeDrawer"></div>
  <div :class="['login-drawer', { 'drawer-open': isOpen }]">
    <LoginForm
      v-if="isOpen && currentForm === 'login'"
      @cancel="closeDrawer"
      @switch-to-signup="currentForm = 'signup'"
      :onSuccess="handleSuccess"
    />
    <SignupForm
      v-else-if="isOpen"
      @cancel="closeDrawer"
      @switch-to-login="currentForm = 'login'"
      :onSuccess="handleSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import LoginForm from './LoginForm.vue'
import SignupForm from './SignupForm.vue'

type FormType = 'login' | 'signup'

const isOpen = ref(false)
const currentForm = ref<FormType>('login')

const closeDrawer = () => {
  isOpen.value = false
}

const openDrawer = () => {
  isOpen.value = true
}

const handleSuccess = async () => {
  // Wait a moment for success message to be visible, then close
  await new Promise(resolve => setTimeout(resolve, 1500))
  closeDrawer()
}

defineExpose({ openDrawer, closeDrawer })

watch(
  () => isOpen.value,
  async (newVal) => {
    if (!newVal) {
      await nextTick()
      currentForm.value = 'login' // reset to login form when closing
    }
  },
)
</script>

<style scoped>
.login-drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 999;
  transition: opacity 0.3s ease-out;
}

.login-drawer {
  position: fixed;
  top: 0;
  right: 0;
  background: white;
  box-shadow: -4px 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  padding: 2rem;
  max-height: 100vh;
  width: 400px;
  overflow-y: auto;
  transform: translateY(-100%);
  /* transition: transform 0.1s ease-out; */
}

.login-drawer.drawer-open {
  transform: translateY(0);
}
</style>
