<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">{{ isEdit ? 'Edit MPA' : 'Create MPA' }}</h1>
    <Form
      :schema="mpaSchema"
      :initialValues="initialValues"
      :fields="fields"
      submitLabel="Create MPA"
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
const isEdit = route.name === 'mpa-edit';

const mpaSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  province: z.string().optional(),
  municipality: z.string().optional(),
  isProtected: z.boolean().optional(),
  files: z.any().optional()
});

const initialValues = reactive({
  name: '',
  email: '',
  province: '',
  municipality: '',
  isProtected: false,
  files: null
});

const fields: Array<{
  name: string;
  label?: string;
  type?: 'text' | 'password' | 'select' | 'checkbox' | 'switch' | 'file';
  options?: string[];
  placeholder?: string;
  props?: Record<string, unknown>;
}> = [
  { name: 'name', label: 'MPA Name', type: 'text', placeholder: 'Enter MPA name' },
  { name: 'email', label: 'Email', type: 'text', placeholder: 'Enter email address' },
  {
    name: 'province',
    label: 'Province',
    type: 'select',
    options: ['Cebu', 'Bohol', 'Palawan']
  },
  {
    name: 'municipality',
    label: 'Municipality',
    type: 'select',
    options: ['Municipality 1', 'Municipality 2']
  },
  { name: 'isProtected', label: 'Is Protected', type: 'switch' },
  { name: 'files', label: 'Supporting Files', type: 'file', props: { multiple: true } }
];

const handleSubmit = (values: Record<string, unknown>) => {
  console.log('MPA Form submitted:', values);
  // TODO: call API to create/update MPA
  router.push({ name: 'mpa-list' });
};

const handleError = (errors: Partial<Record<string, string>>) => {
  console.log('MPA Form errors:', errors);
};

const handleCancel = () => {
  router.push({ name: 'mpa-list' });
};

onMounted(() => {
  if (isEdit) {
    // TODO: load MPA data from store/API
    const id = route.params.id as string;
    console.log('Loading MPA:', id);
  }
});
</script>
