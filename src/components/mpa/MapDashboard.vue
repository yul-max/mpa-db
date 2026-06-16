<template>
  <div class="w-full h-full map-dashboard">
    <div ref="mapElement" class="w-full h-full"></div>

    <div v-if="isFilterButtonLoading" class="filter-button-loading">
      <div class="spinner-small"></div>
    </div>

    <div v-if="isDetailedDataLoading" class="detailed-data-loading">
      <div class="spinner-small"></div>
    </div>

    <PinDrawer />
    <MpaDrawer />

    <FilterModal v-if="filterModalOpen" @close="filterModalOpen = false" @apply="updateWmsLayer" />

    <Loading v-if="loading" />
  </div>
</template>

<script setup lang="ts">
 
import 'leaflet/dist/leaflet.css'

import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as L from 'leaflet';
import 'esri-leaflet';
import 'mapbox-gl/dist/mapbox-gl.css';
import PinDrawer from './MapComponents/PinDrawer.vue';
import MpaDrawer from './MapComponents/MpaDrawer.vue';
import FilterModal from './MapComponents/FilterModal.vue';
import Loading from '@/components/ui/Loading.vue';
import type { WMSGetFeatureInfoParams } from '@/types/map';
import { getDetailedMapData, getGeoserverData } from '../../utils/mapApi';
import { useDrawerStore } from '@/stores/drawer';
import { usePointsStore } from '@/stores/points';
// leaflet plugins and utilities
import CustomAutoGraticule from '@/utils/customAutoGraticule';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet-edgebuffer';
import 'leaflet-search';
import 'leaflet-search/dist/leaflet-search.min.css';
import 'leaflet-easybutton';
import 'leaflet-easybutton/src/easy-button';

const mapElement = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let wmsLayer: L.TileLayer.WMS | null = null;
let detailedDataLayer: L.LayerGroup | any = null;
let markerClusterGroup: any = null;
let currentCqlFilter: string | null = null;

const pointsStore = usePointsStore();
const loading = pointsStore.loading;
const isFilterButtonLoading = ref(true);
const isDetailedDataLoading = ref(false);
const detailedDataLoaded = ref(false);

const drawerStore = useDrawerStore();
const filterModalOpen = ref(false);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PUBLIC_LEAFLET_API = (import.meta.env.PUBLIC_LEAFLET_API || import.meta.env.VITE_LEAFLET_API) as string | undefined;
const PUBLIC_MAPBOX_API = (import.meta.env.PUBLIC_MAPBOX_API || import.meta.env.VITE_MAPBOX_API) as string | undefined;
const PUBLIC_GEOSERVER_URL = (import.meta.env.PUBLIC_GEOSERVER_URL || import.meta.env.VITE_GEOSERVER_URL) as string | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PUBLIC_LINODE_URL = (import.meta.env.PUBLIC_LINODE_URL || import.meta.env.VITE_LINODE_URL) as string | undefined;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PUBLIC_LOCALE_URL = (import.meta.env.PUBLIC_LOCALE_URL || import.meta.env.VITE_LOCALE_URL) as string | undefined;

async function initializeMap() {
  if (!mapElement.value) return;

  map = L.map(mapElement.value, {
    minZoom: 3,
    maxZoom: 19,
    zoom: 5,
    center: [13.0, 122.0]
  });

  const baseLayers = {
    'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 18
    }).addTo(map),
    'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }),
    'CartoDB Light': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }),
    'Mapbox Street': L.tileLayer(`https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=${PUBLIC_MAPBOX_API || ''}`, {
      tileSize: 512,
      zoomOffset: -1,
      attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> contributors',
      id: 'mapbox/streets-v12'
    } as L.TileLayerOptions & { id: string }),
    'Ocean': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 13
    })
  };

  wmsLayer = L.tileLayer.wms(`${PUBLIC_GEOSERVER_URL || ''}/mpad_Geoserver/wms`, {
    layers: 'mpad_Geoserver:augCheckedCoord',
    format: 'image/png',
    transparent: true,
    attribution: 'MPA Support Network'
  });

  wmsLayer.addTo(map);

  // Use marker cluster group for detailed points with custom styling
  try {
    const markerClusterOptions = {
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        return (L as any).divIcon({
          html: `<div style="background-color: #FF6B6B; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; border: 2px solid white;">${count}</div>`,
          iconSize: [40, 40],
          className: 'marker-cluster'
        });
      }
    };
    markerClusterGroup = (L as any).markerClusterGroup ? (L as any).markerClusterGroup(markerClusterOptions) : L.layerGroup();
  } catch {
    markerClusterGroup = L.layerGroup();
  }
  detailedDataLayer = markerClusterGroup;

  const overlays = {
    'Marine Protected Areas': wmsLayer,
    'Detailed MPA Data (red circles)': detailedDataLayer
  };

  L.control.layers(baseLayers, overlays).setPosition('topleft').addTo(map);
  L.control.scale().setPosition('bottomright').addTo(map);

  map.on('overlayadd', (e: any) => {
    if (e.name === 'Detailed MPA Data (red circles)' && !detailedDataLoaded.value) {
      loadDetailedMapData();
    }
  });

  // add auto graticule
  try { new CustomAutoGraticule().addTo(map); } catch (e) { console.warn('CustomAutoGraticule not available', e); }

  // add filter easy button
  try {
    (L as any).easyButton('<svg xmlns="http://www.w3.org/2000/svg" width="1.9rem" height="1.9rem" aria-label="Filter" viewBox="0 0 24 24" overflow="visible"><rect width="24" height="28" fill="white"  /><path fill="black" d="M14 12v7.88c.04.3-.06.62-.29.83a.996.996 0 0 1-1.41 0l-2.01-2.01a.99.99 0 0 1-.29-.83V12h-.03L4.21 4.62a1 1 0 0 1 .17-1.4c.19-.14.40-.22.62-.22h14c.22 0 .43.08.62.22a1 1 0 0 1 .17 1.4L14.03 12H14z" /></svg>', openFilterModal).addTo(map as L.Map);
  } catch (e) { console.warn('easyButton not available', e); }

  // Attach WMS click handler
  WmsClickHandler(wmsLayer);

  pointsStore.loading = false;
  isFilterButtonLoading.value = false;
}

function openFilterModal() {
  filterModalOpen.value = true;
}

function callDrawerMap(properties: any) {
  drawerStore.openMpa(properties);
}

function WmsClickHandler(wms: L.TileLayer.WMS | null) {
  if (!map || !wms) return;
  map.on('click', function (e: L.LeafletMouseEvent) {
    const point: L.Point = map!.latLngToContainerPoint(e.latlng);
    const size = map!.getSize();
    const params: WMSGetFeatureInfoParams = {
      request: 'GetFeatureInfo',
      service: 'WMS',
      srs: 'EPSG:4326',
      styles: '',
      transparent: true,
      format: 'image/png',
      bbox: map!.getBounds().toBBoxString(),
      width: size.x,
      height: size.y,
      layers: (wms as any).options.layers,
      query_layers: (wms as any).options.layers,
      info_format: 'application/json',
      feature_count: 50,
      x: Math.round(point.x),
      y: Math.round(point.y)
    };

    if (currentCqlFilter) {
      (params as WMSGetFeatureInfoParams & { cql_filter?: string }).cql_filter = currentCqlFilter;
    }

    getGeoserverData(params).then((features: any[]) => {
      if (!features || features.length === 0) return;
      if (features.length > 1) {
        showFeatureSelectionUI(features, e.latlng);
      } else if (features.length === 1) {
        handleSingleFeature(features[0]);
      }
    }).catch((err: unknown) => console.error('getGeoserverData error', err));
  });
}

function showFeatureSelectionUI(features: unknown[], latlng: L.LatLng) {
  let popupContent = '<div class="feature-selector"><h4>Select an MPA: </h4><ul>';
  features.forEach((feature: any, index: number) => {
    const zoneId = feature.properties?.zone_id || (feature.properties?.['mpa_id-zon'] ? parseInt(feature.properties['mpa_id-zon'].split('-')[1]) : 0);
    const zoneName = ({} as any)[zoneId] || feature.properties?.complete_name || 'MPA';
    popupContent += `<li><a href="#" class="feature-select-link" data-index="${index}">${feature.properties?.complete_name || zoneName}</a></li>`;
  });
  popupContent += '</ul></div>';

  const popup = L.popup().setLatLng(latlng).setContent(popupContent);
  popup.openOn(map!);

  setTimeout(() => {
    document.querySelectorAll('.feature-select-link').forEach((el) => {
      el.addEventListener('click', (ev) => {
        ev.preventDefault();
        const idx = parseInt((el as HTMLElement).getAttribute('data-index') || '0');
        handleSingleFeature(features[idx]);
        map?.closePopup(popup);
      });
    });
  }, 100);
}

function handleSingleFeature(feature: any) {
  // zoom to feature
  if (!map) return;
  try {
    const geo = L.geoJSON(feature);
    const bounds = geo.getBounds();
    if (feature.geometry && feature.geometry.type === 'Point') {
      const latlng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
      map.setView(latlng, 11);
    } else {
      map.fitBounds(bounds, { maxZoom: 10 });
    }
  } catch (e) {
    console.warn('handleSingleFeature error', e);
  }

  // open drawer with properties
  drawerStore.openMpa(feature.properties || feature);
}

async function updateWmsLayer(response: any) {
  // Build CQL filter from filter form response
  const cqlFilters: string[] = [];

  if (response?.mpa) {
    // MPA flag is on
    if (response.nipas !== '' && response.nipas !== null && response.nipas !== undefined) {
      const nipasBool = response.nipas === '1' || response.nipas === 1 ? true : false;
      cqlFilters.push(`"properties.is_nipas"=${nipasBool ? '1' : '0'}`);
    }

    if (response.ecosystem && response.ecosystem !== 'All') {
      cqlFilters.push(`"properties.Type"=${response.ecosystem}`);
    }

    if (response.mpaMinYear !== null && response.mpaMinYear !== undefined && response.mpaMaxYear !== null && response.mpaMaxYear !== undefined) {
      cqlFilters.push(`"properties.year_established">=${response.mpaMinYear} AND "properties.year_established"<=${response.mpaMaxYear}`);
    } else if (response.mpaMinYear !== null && response.mpaMinYear !== undefined) {
      cqlFilters.push(`"properties.year_established">=${response.mpaMinYear}`);
    } else if (response.mpaMaxYear !== null && response.mpaMaxYear !== undefined) {
      cqlFilters.push(`"properties.year_established"<=${response.mpaMaxYear}`);
    }
  }

  const cqlFilter = cqlFilters.length > 0 ? cqlFilters.join(' AND ') : null;
  currentCqlFilter = cqlFilter;

  const wmsLayerVisible = map && wmsLayer ? map.hasLayer(wmsLayer) : false;

  if (map && wmsLayer) {
    map.removeLayer(wmsLayer);
  }

  wmsLayer = L.tileLayer.wms(`${PUBLIC_GEOSERVER_URL || ''}/mpad_Geoserver/wms`, {
    layers: 'mpad_Geoserver:augCheckedCoord',
    format: 'image/png',
    transparent: true,
    attribution: 'MPA Support Network',
    cql_filter: cqlFilter
  } as L.WMSOptions);

  if (wmsLayerVisible) {
    wmsLayer.addTo(map!);
  }
}

async function loadDetailedMapData() {
  if (detailedDataLoaded.value) return;
  if (!detailedDataLayer) detailedDataLayer = L.layerGroup();
  isDetailedDataLoading.value = true;
  try {
    const data = await getDetailedMapData();
    data.forEach((pt: any) => {
      if (pt.latitude && pt.longitude) {
        const marker = L.circleMarker([parseFloat(pt.latitude), parseFloat(pt.longitude)], { radius: 5, fillColor: '#FF0000', color: '#000' });
        marker.bindTooltip(pt.complete_name || 'MPA');
        marker.bindPopup(`<strong>${pt.complete_name || 'MPA'}</strong>`);
        marker.on('click', () => callDrawerMap(pt));
        marker.addTo(detailedDataLayer!);
      }
    });
    detailedDataLoaded.value = true;
  } catch (err) {
    console.error('loadDetailedMapData error', err);
  } finally {
    isDetailedDataLoading.value = false;
  }
}

onMounted(() => {
  initializeMap();
});

onBeforeUnmount(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style scoped>
.filter-button-loading { position: absolute; top: 140px; left: 10px; z-index: 1000; background-color: white; border-radius: 4px; padding: 7px; box-shadow: 0 1px 5px rgba(0,0,0,0.4); }
.spinner-small { border: 2px solid rgba(0,0,0,0.1); border-left-color: #000; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; }
.detailed-data-loading { position: absolute; top: 180px; left: 10px; z-index: 1000; background-color: white; border-radius: 4px; padding: 7px; box-shadow: 0 1px 5px rgba(0,0,0,0.4); }
@keyframes spin { to { transform: rotate(360deg); } }
.map-dashboard > div[ref] { width: 100%; height: 100%; }
</style>
