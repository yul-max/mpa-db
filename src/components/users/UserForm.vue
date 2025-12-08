<template>
<div class="space-y-6">
<h1 class="text-2xl font-bold">{{ isEdit ? 'Edit User' : 'Create User' }}</h1>
<MultiStepForm resource="user" :mode="isEdit ? 'edit' : 'create'" v-model="form" @submit="submit" />
</div>
</template>
<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUsersStore } from '@/store/users';
import MultiStepForm from '@/components/ui/MultiStepForm.vue';


const route = useRoute();
const router = useRouter();
const store = useUsersStore();
const isEdit = route.name === 'users-edit';
const form = reactive({});
async function load(){ if (isEdit){ const id = route.params.id as string; const data = await store.fetchById(id); Object.assign(form, data); } }
async function submit(values:any){ if (isEdit) await store.update(values.id, values); else await store.create(values); router.push({ name: 'users-list' }); }
onMounted(load);
</script>
