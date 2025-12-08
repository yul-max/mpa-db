<template>
<div class="space-y-6">
<div class="flex items-center justify-between">
<h1 class="text-2xl font-bold">User Details</h1>
<button v-if="can('users:edit')" @click="goToEdit" class="px-3 py-1 bg-blue-600 text-white rounded">Edit</button>
</div>
<div class="border rounded p-4">
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
<div><strong>Email</strong><div>{{ user.email }}</div></div>
<div><strong>Role</strong><div>{{ user.role }}</div></div>
<div v-if="user.createdAt"><strong>Created</strong><div>{{ formatDate(user.createdAt) }}</div></div>
</div>
</div>
<div v-if="can('audit:view')" class="border rounded p-4">
<h2 class="text-lg font-semibold">Audit Trail</h2>
<!-- AuditTrail component placeholder -->
</div>
</div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUsersStore } from '@/store/users';
import { useCan } from '@/composables/useCan';
import { formatDate } from '@/utils/formatters';


const route = useRoute();
const router = useRouter();
const store = useUsersStore();
const { can } = useCan();
const user = ref<any>({});
async function load() { const id = route.params.id as string; user.value = await store.fetchById(id); }
function goToEdit(){ router.push({ name: 'users-edit', params: { id: user.value.id } }); }
onMounted(load);
</script>
