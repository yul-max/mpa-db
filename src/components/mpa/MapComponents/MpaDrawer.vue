<template>
  <div v-if="store.mpa.isOpen" class="mpa-drawer">
    <div class="drawer-header">
      <h3>MPA Details</h3>
      <button @click="store.closeMpa()">Close</button>
    </div>
    <pre>{{ store.mpa.properties }}</pre>
  </div>
</template>

<script setup lang="ts">
import { useDrawerStore } from '@/stores/drawer';
const store = useDrawerStore();
</script>

<style scoped>
.mpa-drawer { position: absolute; right: 0; top: 80px; width: 360px; background: white; z-index: 1200; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.2);} 
.drawer-header { display:flex; justify-content:space-between; align-items:center; }
</style>
