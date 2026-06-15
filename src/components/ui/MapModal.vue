<template>
  <div v-if="open" class="map-modal-overlay" @click.self="emit('close')">
    <div class="map-modal-card">
      <div class="map-modal-header">
        <h3 class="map-modal-title">{{ title }}</h3>
        <FontAwesomeIcon
          :icon="['fas', 'times']"
          class="map-modal-close"
          @click="emit('close')"
          aria-label="Close"
        />
      </div>
      <div class="map-modal-body">
        <div ref="mapElement" class="map-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  open: boolean;
  title?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  mpaName?: string;
  mpaId?: number | string | null;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'MPA Location',
  mpaName: 'MPA'
});

const emit = defineEmits<{
  close: [];
}>();

const mapElement = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let wmsLayer: L.TileLayer.WMS | null = null;

const PUBLIC_GEOSERVER_URL = (import.meta.env.PUBLIC_GEOSERVER_URL || import.meta.env.VITE_GEOSERVER_URL) as string | undefined;

const initializeMap = () => {
  if (!mapElement.value) return;
  if (map) {
    map.remove();
    map = null;
  }

  const lat = typeof props.latitude === 'string' ? parseFloat(props.latitude) : props.latitude;
  const lng = typeof props.longitude === 'string' ? parseFloat(props.longitude) : props.longitude;

  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    console.warn('Invalid coordinates for map modal');
    return;
  }

  map = L.map(mapElement.value, {
    center: [lat, lng],
    zoom: 12,
    zoomControl: true,
    scrollWheelZoom: true
  });

  // Add satellite base layer
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 18
  }).addTo(map);

  // Add WMS layer for MPA polygons - must be added before marker to show underneath
  if (PUBLIC_GEOSERVER_URL) {
    const wmsParams: any = {
      layers: 'mpad_Geoserver:augCheckedCoord',
      format: 'image/png',
      transparent: true,
      attribution: 'MPA Support Network',
      version: '1.1.0'
    };

    // Add CQL filter if mpaId is provided to highlight only this MPA
    if (props.mpaId) {
      wmsParams.cql_filter = `id=${props.mpaId}`;
    }

    wmsLayer = L.tileLayer.wms(`${PUBLIC_GEOSERVER_URL}/mpad_Geoserver/wms`, wmsParams);
    wmsLayer.addTo(map);
    wmsLayer.setZIndex(1000); // Ensure it's above the base layer
  }

  // Create custom icon for the marker
  const customIcon = L.divIcon({
    html: '<div class="mpa-marker-icon"></div>',
    className: 'custom-mpa-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  // Add marker for the MPA
  L.marker([lat, lng], { icon: customIcon })
    .addTo(map)
    .bindPopup(`<strong>${props.mpaName}</strong><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`)
    .openPopup();

  // Add scale control
  L.control.scale({ position: 'bottomright' }).addTo(map);
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.open) {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape);
});

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    initializeMap();
  } else {
    if (map) {
      map.remove();
      map = null;
    }
  }
}, { immediate: false });
</script>

<style scoped>
.map-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 1rem;
}

.map-modal-card {
  background: #ffffff;
  border-radius: 0.75rem;
  width: min(90vw, 900px);
  height: min(85vh, 700px);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.map-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.map-modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.map-modal-close {
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
  transition: color 0.2s;
}

.map-modal-close:hover {
  color: #0f172a;
}

.map-modal-body {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

/* Custom marker styling */
:deep(.custom-mpa-marker) {
  background: transparent;
  border: none;
}

:deep(.mpa-marker-icon) {
  width: 30px;
  height: 30px;
  background: #ef4444;
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}
</style>
