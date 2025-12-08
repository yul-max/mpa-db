<template>
<div>
<h1 class="text-2xl font-bold mb-4">MPAs</h1>
<table class="w-full border">
<thead><tr><th class="p-2">Name</th><th class="p-2">Province</th></tr></thead>
<tbody>
<tr v-for="r in rows" :key="r.id"><td class="p-2">{{ r.name }}</td><td class="p-2">{{ r.province }}</td></tr>
</tbody>
</table>
</div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchMPAs } from '@/api/mpa';
const rows = ref<any[]>([]);
onMounted(async ()=>{ const resp = await fetchMPAs({}); rows.value = resp.data?.data || []; });
</script>
