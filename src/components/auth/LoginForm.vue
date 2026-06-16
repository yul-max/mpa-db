<template>
  <div class="">
    <div class="">
      <div class="">
        <div class="">
          <div class="header-medium-3xl">Welcome Back</div>
          <div class="text-center">
            <span>Don't have an account? </span>
            <span class="clickable hoverable underline" @click="$emit('switch-to-signup')"
              >Sign up</span
            >
          </div>
        </div>
      </div>
      <div class="login-form-body-wrapper">
        <Form
          :schema="loginSchema"
          :initialValues="initialValues"
          :fields="fields"
          submitLabel="Sign In"
          cancelLabel="Close"
          :submit="handleSubmit"
          :onSuccess="onSuccess"
          @cancel="$emit('cancel')"
          buttonFill
          clearOnCancel
        />
      </div>
      <!-- <a class="clickable hoverable-white">Forgot Password?</a> NOT YET AVAILABLE -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { type LoginFormPayload } from '@/types/forms'
import Form from '@/components/ui/Form.vue'
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore()

defineProps<{
  onSuccess?: () => void | Promise<void>
}>();

defineEmits(['cancel', 'switch-to-signup'])

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

const initialValues: LoginFormPayload = {
  username: '',
  password: '',
}

const fields: Array<{
  name: string
  label?: string
  type?: 'text' | 'password' | 'select' | 'checkbox' | 'file'
  placeholder?: string
}> = [
  { name: 'username', label: 'Username', type: 'text', placeholder: 'Enter username' },
  { name: 'password', label: 'Password', type: 'password', placeholder: 'Enter password' },
]

const handleSubmit = async (values: LoginFormPayload) => {
  const result = await authStore.login(values)
  return result
}
</script>
