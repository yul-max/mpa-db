import type * as L from 'leaflet';
import type { WMSGetFeatureInfoParams } from '@/types/map';

interface WmsClickHandlerDeps {
  map: L.Map;
  wms: L.TileLayer.WMS;
  currentCqlFilter?: string | null;
  getGeoserverData: (params: WMSGetFeatureInfoParams) => Promise<any[] | null>;
  showFeatureSelectionUI: (features: unknown[], latlng: L.LatLng) => void;
  handleSingleFeature: (feature: unknown) => void;
}

/**
 * Binds a click handler that performs WMS GetFeatureInfo queries.
 * This utility is decoupled from component state by receiving all dependencies
 * through function parameters.
 */
export function bindWmsClickHandler({
  map,
  wms,
  currentCqlFilter,
  getGeoserverData,
  showFeatureSelectionUI,
  handleSingleFeature
}: WmsClickHandlerDeps): void {
  map.on('click', (e: L.LeafletMouseEvent) => {
    const point = map.latLngToContainerPoint(e.latlng);
    const size = map.getSize();

    const params: WMSGetFeatureInfoParams = {
      request: 'GetFeatureInfo',
      service: 'WMS',
      srs: 'EPSG:4326',
      styles: '',
      transparent: true,
      format: 'image/png',
      bbox: map.getBounds().toBBoxString(),
      width: size.x,
      height: size.y,
      layers: (wms as any).options.layers,
      query_layers: (wms as any).options.layers,
      info_format: 'application/json',
      feature_count: 50,
      x: Math.round(point.x),
      y: Math.round(point.y),
      ...(currentCqlFilter ? { cql_filter: currentCqlFilter } : {})
    };

    getGeoserverData(params)
      .then((features) => {
        if (!features || features.length === 0) return;
        if (features.length > 1) {
          showFeatureSelectionUI(features, e.latlng);
          return;
        }
        handleSingleFeature(features[0]);
      })
      .catch((err: unknown) => {
        console.error('getGeoserverData error', err);
      });
  });
}
