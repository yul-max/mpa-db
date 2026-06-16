<template>
  <div v-if="store.pin.isOpen" class="pin-drawer">
    <div class="drawer-header">
      <h3>Pin Details</h3>
      <button @click="store.closePin()">Close</button>
    </div>
    <pre>{{ store.pin.properties }}</pre>
  </div>
</template>

<script setup lang="ts">
import { useDrawerStore } from '@/stores/drawer';
const store = useDrawerStore();
</script>

<style scoped>
.pin-drawer { position: absolute; right: 0; top: 80px; width: 320px; background: white; z-index: 1200; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.2);}
.drawer-header { display:flex; justify-content:space-between; align-items:center; }
</style>
