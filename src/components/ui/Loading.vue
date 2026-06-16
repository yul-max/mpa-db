<template>
  <div class="loading-overlay">
    <div class="loader">Loading...</div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.loading-overlay { position: absolute; inset: 0; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.8); z-index:1400; }
.loader { padding: 12px 18px; background: white; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,.15); }
</style>
