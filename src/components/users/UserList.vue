<template>
  <GenericDataTable
    :rows="users"
    :columns="tableColumns"
    :totalRecords="totalRecords"
    :loading="loading"
    :pageSize="rowsPerPage"
    exportListName="User"
    :exportAllRows="fetchAllUsersForExport"
    @page="onPageChange"
    @row-click="handleRowClick"
    @create="openCreateForm"
  >
    <template #header>
      <h1 class="text-2xl font-bold">Users</h1>
    </template>
  </GenericDataTable>

  <AddUserForm
    ref="addUserFormRef"
    @submit="handleCreateUser"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { ColumnDef } from '@/types/ui';
import { fetchUsers } from '@/api/users';
import GenericDataTable from '@/components/ui/GenericDataTable.vue';
import AddUserForm from '@/components/users/AddUserForm.vue';

const router = useRouter();
const users = ref<any[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const rowsPerPage = ref(10);
const totalRecords = ref(0);
const addUserFormRef = ref<InstanceType<typeof AddUserForm> | null>(null);

const tableColumns = ref<ColumnDef[]>([
  {
    field: 'full_name',
    header: 'Full Name',
    show: true,
    colWidth: 260,
    type: 'string',
    exportValue: (row) => formatFullName(row as Record<string, any>),
    render: (row) => formatFullName(row as Record<string, any>)
  },
  { field: 'email', header: 'Email', show: true, colWidth: 260, type: 'string' },
  { field: 'province', header: 'Province', show: true, type: 'string' },
  { field: 'municipality', header: 'Municipality', show: true, type: 'string' },
  { field: 'user_type', header: 'User Type', show: true, type: 'number' }
]);

const formatFullName = (user: Record<string, any>) => {
  const first = user.first_name || '';
  const last = user.last_name || '';
  const fullName = `${first} ${last}`.trim();
  return fullName || 'Not specified';
};

const onPageChange = (event: any) => {
  currentPage.value = Math.floor(event.first / event.rows) + 1;
  rowsPerPage.value = event.rows;
  fetchData();
};

const fetchData = async () => {
  loading.value = true;
  try {
    const resp = await fetchUsers({
      _page: currentPage.value,
      _limit: rowsPerPage.value
    });

    const data = resp.data || [];
    users.value = Array.isArray(data) ? data : data.rows || [];
    totalRecords.value = data.count || users.value.length;
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    loading.value = false;
  }
};

const fetchAllUsersForExport = async (): Promise<Record<string, unknown>[]> => {
  const limit = totalRecords.value > 0 ? totalRecords.value : 10000;
  const resp = await fetchUsers({ _page: 1, _limit: limit });
  const data = resp.data || [];
  const rows = Array.isArray(data) ? data : data.rows || [];
  return rows as Record<string, unknown>[];
};

const navigateToDetails = (userId: number | string) => {
  router.push({ name: 'users-details', params: { id: userId } });
};

const handleRowClick = (row: any) => {
  navigateToDetails(row.user_id || row.id);
};

const openCreateForm = () => {
  addUserFormRef.value?.open();
};

const handleCreateUser = (data: Record<string, any>) => {
  console.log('Creating new user:', data);
  // TODO: Implement API call to create user
  // After successful creation, refresh the list
  fetchData();
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped></style>
