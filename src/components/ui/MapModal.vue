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

import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchMPAMap } from '@/api/mpa';

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
let geoJsonLayer: L.GeoJSON | null = null;

const initializeMap = () => {
  if (!mapElement.value) return;
  if (map) {
    map.remove();
    map = null;
  }

  const lat = typeof props.latitude === 'string' ? parseFloat(props.latitude) : props.latitude;
  const lng = typeof props.longitude === 'string' ? parseFloat(props.longitude) : props.longitude;
  const hasCoords = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

  if (!hasCoords && props.mpaId == null) {
    console.warn('No coordinates or MPA id for map modal');
    return;
  }

  map = L.map(mapElement.value, {
    // Default to the Philippines; fitBounds will re-center once the polygon loads
    center: hasCoords ? [lat as number, lng as number] : [12.8797, 121.774],
    zoom: hasCoords ? 12 : 6,
    zoomControl: true,
    scrollWheelZoom: true
  });

  // Add satellite base layer
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 18
  }).addTo(map);

  // Add GeoJSON layer for this MPA's polygon - must be added before marker to show underneath
  if (props.mpaId != null) {
    loadMpaGeoJson(props.mpaId);
  }

  // Add marker for the MPA when coordinates are available
  if (hasCoords) {
    const customIcon = L.divIcon({
      html: '<div class="mpa-marker-icon"></div>',
      className: 'custom-mpa-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    L.marker([lat as number, lng as number], { icon: customIcon })
      .addTo(map)
      .bindPopup(`<strong>${props.mpaName}</strong><br>Lat: ${(lat as number).toFixed(6)}<br>Lng: ${(lng as number).toFixed(6)}`)
      .openPopup();
  }

  // Add scale control
  L.control.scale({ position: 'bottomright' }).addTo(map);
};

const loadMpaGeoJson = async (mpaId: number | string) => {
  try {
    const { data } = await fetchMPAMap(mpaId);
    if (!map || !data?.features?.length) return;

    geoJsonLayer = L.geoJSON(data, {
      style: {
        color: '#22d3ee',
        weight: 2,
        fillColor: '#22d3ee',
        fillOpacity: 0.25
      },
      attribution: 'MPA Support Network'
    }).addTo(map);

    const bounds = geoJsonLayer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  } catch (error) {
    console.error('Failed to load MPA map data:', error);
  }
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
      geoJsonLayer = null;
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
