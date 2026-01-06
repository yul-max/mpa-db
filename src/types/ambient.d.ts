declare module 'esri-leaflet-vector';
declare module 'esri-leaflet';
declare module 'leaflet.markercluster';
declare module 'leaflet-search';
declare module 'leaflet-easybutton';
declare module 'leaflet-edgebuffer';
declare module 'leaflet-auto-graticule';

// Allow importing modules without types during transition
declare module '*-leaflet*';
declare module '@/utils/mapApi';

// Vue single-file component shim
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
