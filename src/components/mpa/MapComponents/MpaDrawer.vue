<template>
  <div v-if="store.mpa.isOpen">
    <div class="backdrop" @click="store.closeMpa()"></div>
    <div class="mpa-drawer" @click.stop>
      <!-- <div class="drawer-header">
        <button @click="store.closeMpa()">Close</button>
      </div> -->
      <div class="details-container" v-if="store.mpa.properties">
      <div class="details-section">
        <h4>Basic Information</h4>
        <div class="detail-row">
          <span class="label">Name:</span>
          <span class="value">{{ store.mpa.properties.complete_name }}</span>
        </div>
        <div class="detail-row">
          <span class="label">ID:</span>
          <span class="value">{{ store.mpa.properties.id }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Zone:</span>
          <span class="value">{{ store.mpa.properties.zone_id }}</span>
        </div>
      </div>

      <div class="details-section">
        <h4>Location</h4>
        <div class="detail-row">
          <span class="label">Province:</span>
          <span class="value">{{ store.mpa.properties.province }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Municipality:</span>
          <span class="value">{{ store.mpa.properties.municipality }}</span>
        </div>
        <div class="detail-row" v-if="store.mpa.properties.barangay !== 'NULL'">
          <span class="label">Barangay:</span>
          <span class="value">{{ store.mpa.properties.barangay }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Latitude:</span>
          <span class="value">{{ store.mpa.properties.latitude }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Longitude:</span>
          <span class="value">{{ store.mpa.properties.longitude }}</span>
        </div>
      </div>

      <div class="details-section">
        <h4>Area</h4>
        <div class="detail-row">
          <span class="label">Total Area:</span>
          <span class="value">{{ formatNumber(store.mpa.properties.total_area) }} Ha</span>
        </div>
        <div class="detail-row">
          <span class="label">Core Area:</span>
          <span class="value">{{ formatNumber(store.mpa.properties.core_area) }} Ha</span>
        </div>
        <div class="detail-row">
          <span class="label">Buffer Area:</span>
          <span class="value">{{ formatNumber(store.mpa.properties.buffer_area) }} Ha</span>
        </div>
      </div>

      <div class="details-section">
        <h4>Dates</h4>
        <div class="detail-row">
          <span class="label">Year Established:</span>
          <span class="value">{{ store.mpa.properties.year_established }}</span>
        </div>
        <div class="detail-row" v-if="store.mpa.properties.date_established !== 'NULL'">
          <span class="label">Date Established:</span>
          <span class="value">{{ store.mpa.properties.date_established }}</span>
        </div>
      </div>

      <div class="details-section">
        <h4>Status</h4>
        <div class="detail-row">
          <span class="label">Validated:</span>
          <span class="value">{{ store.mpa.properties.is_validated === '1' ? 'Yes' : 'No' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">NIPAS:</span>
          <span class="value">{{ store.mpa.properties.is_nipas === 1 ? 'Yes' : 'No' }}</span>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { useDrawerStore } from '@/stores/drawer';
const store = useDrawerStore();

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};
</script>

<style scoped>
.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 1100;
}

.mpa-drawer { position: absolute; right: 0; top: 72px; width: 360px; background: white; z-index: 1201; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.2);}
.drawer-header { display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px; }
.drawer-header h3 { margin: 0; font-size: 1.125rem; }
.drawer-header button { background: none; border: none; cursor: pointer; font-size: 0.875rem; color: #666; }

.details-container {
  overflow-y: auto;
  max-height: calc(100vh - 150px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.details-section {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 12px;
}

.details-section:last-child {
  border-bottom: none;
}

.details-section h4 {
  margin: 0 0 8px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #0369a1;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 0.8125rem;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 500;
  color: #666;
  flex-shrink: 0;
}

.value {
  color: #222;
  text-align: right;
  word-break: break-word;
  flex: 1;
}
</style>
