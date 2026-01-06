<template>
  <div class="filter-modal">
    <div class="modal-card">
      <header>
        <h3>Filter Points of Interest</h3>
        <button @click="$emit('close')">Close</button>
      </header>
      <section>
        <div class="filter-group">
          <label>MPA</label>
          <input v-model="form.mpa" type="checkbox" />
        </div>
        <div class="filter-group">
          <label>NIPAS Status</label>
          <select v-model="form.nipas">
            <option value="">Any</option>
            <option value="1">NIPAS</option>
            <option value="0">Non-NIPAS</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Ecosystem</label>
          <select v-model="form.ecosystem">
            <option value="All">All</option>
            <option value="1">Corals</option>
            <option value="2">Mangroves</option>
            <option value="3">Seagrass</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Min Year</label>
          <input v-model.number="form.mpaMinYear" type="number" />
        </div>
        <div class="filter-group">
          <label>Max Year</label>
          <input v-model.number="form.mpaMaxYear" type="number" />
        </div>
        <div class="button-group">
          <button @click="apply">Apply</button>
          <button @click="reset">Reset</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const emit = defineEmits(['close', 'apply']);
const form = ref({
  mpa: true,
  nipas: '',
  ecosystem: 'All',
  mpaMinYear: null as number | null,
  mpaMaxYear: null as number | null
});
function apply() {
  emit('apply', form.value);
  emit('close');
}
function reset() {
  form.value = {
    mpa: true,
    nipas: '',
    ecosystem: 'All',
    mpaMinYear: null,
    mpaMaxYear: null
  };
}
</script>

<style scoped>
.filter-modal { position: absolute; left: 12px; top: 80px; z-index: 1300; }
.modal-card { background: white; padding: 16px; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,.2); min-width: 280px; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
header h3 { margin: 0; font-size: 1rem; }
header button { padding: 4px 8px; background: #e0e0e0; border: none; border-radius: 4px; cursor: pointer; }
.filter-group { margin-bottom: 10px; display: flex; flex-direction: column; }
.filter-group label { font-size: 0.9rem; margin-bottom: 4px; font-weight: 500; }
.filter-group input, .filter-group select { padding: 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem; }
.button-group { display: flex; gap: 8px; margin-top: 12px; }
.button-group button { flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
.button-group button:hover { background: #0056b3; }
</style>

