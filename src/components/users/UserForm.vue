<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">{{ isEdit ? 'Edit User' : 'Create User' }}</h1>
    <Form
      :schema="userSchema"
      :initialValues="initialValues"
      :fields="fields"
      submitLabel="Create User"
      cancelLabel="Cancel"
      @submit="handleSubmit"
      @error="handleError"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod';
import { onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Form from '@/components/ui/Form.vue';

const route = useRoute();
const router = useRouter();
const isEdit = route.name === 'users-edit';

const userSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'contributor', 'viewer']),
  username: z.string().min(3, 'Username must be at least 3 characters').or(z.literal(''))
});

const initialValues = reactive({
  name: '',
  email: '',
  role: 'viewer',
  username: ''
});

const fields: Array<{
  name: string;
  label?: string;
  type?: 'text' | 'password' | 'select' | 'checkbox' | 'file';
  options?: string[];
  placeholder?: string;
}> = [
  { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter full name' },
  { name: 'username', label: 'Username', type: 'text', placeholder: 'Enter username' },
  { name: 'email', label: 'Email', type: 'text', placeholder: 'Enter email address' },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    options: ['admin', 'contributor', 'viewer']
  }
];

const handleSubmit = (values: Record<string, unknown>) => {
  console.log('User Form submitted:', values);
  // TODO: call API to create/update user
  router.push({ name: 'users-list' });
};

const handleError = (errors: Partial<Record<string, string>>) => {
  console.log('User Form errors:', errors);
};

const handleCancel = () => {
  router.push({ name: 'users-list' });
};

onMounted(() => {
  if (isEdit) {
    // TODO: load user data from store/API
    const id = route.params.id as string;
    console.log('Loading user:', id);
  }
});
</script>
