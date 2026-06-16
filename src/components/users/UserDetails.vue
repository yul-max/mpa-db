<template>
  <Details
    :data="userData"
    :loading="loading"
    :title="detailsTitle"
    :subtitle="detailsSubtitle"
    :sections="userDetailsSections"
    back-link="/users"
    back-label="Back to Users"
    :edit-link="editLinkRoute"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, type RouteLocationRaw } from 'vue-router';
import Details from '@/components/ui/Details.vue';
import { fetchUser } from '@/api/users';

interface FieldConfig {
  key: string;
  label: string;
  fullWidth?: boolean;
  type?: 'text' | 'number' | 'boolean' | 'date';
  formatter?: (value: any) => string;
}

interface SectionConfig {
  title: string;
  fields: FieldConfig[];
}

const route = useRoute();
const userData = ref<any>(null);
const loading = ref(true);

const editLinkRoute = computed((): RouteLocationRaw | null => {
  return { name: 'users-edit', params: { id: route.params.id } };
});

const userDetailsSections: SectionConfig[] = [
  {
    title: 'Account Information',
    fields: [
      { key: 'user_name', label: 'Username' },
      { key: 'email', label: 'Email' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' }
    ]
  },
  {
    title: 'Location',
    fields: [
      { key: 'barangay', label: 'Barangay' },
      { key: 'municipality', label: 'Municipality' },
      { key: 'province', label: 'Province' }
    ]
  },
  {
    title: 'Account Type',
    fields: [
      { key: 'user_type', label: 'User Type', type: 'number' }
    ]
  }
];

const detailsTitle = computed(() => {
  if (!userData.value) return 'User Details';
  const first = userData.value.first_name || '';
  const last = userData.value.last_name || '';
  const fullName = `${first} ${last}`.trim();
  return fullName || userData.value.user_name || 'User Details';
});

const detailsSubtitle = computed(() => {
  const source = userData.value;
  if (!source) return '';
  const parts: string[] = [];
  if (source.barangay) parts.push(`Brgy. ${source.barangay}`);
  if (source.municipality) parts.push(source.municipality);
  if (source.province) parts.push(source.province);
  return parts.join(', ');
});

onMounted(async () => {
  try {
    loading.value = true;
    const userId = route.params.id;

    if (typeof userId === 'string' || typeof userId === 'number') {
      const response = await fetchUser(userId);
      userData.value = response.data ?? null;
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
  } finally {
    loading.value = false;
  }
});
</script>
