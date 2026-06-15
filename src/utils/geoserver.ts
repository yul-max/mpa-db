import * as L from 'leaflet';
import type { WMSGetFeatureInfoParams } from '@/types/map';

let map: L.Map | null = null;

function WmsClickHandler(e: L.LeafletMouseEvent) {
  const point: L.Point = map!.latLngToContainerPoint(e.latlng);
  const size = map!.getSize();
  const params: Record<string, unknown> = {
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

  if (currentCqlFilter) params.cql_filter = currentCqlFilter;

  getGeoserverData(params).then((features: any[]) => {
    if (!features || features.length === 0) return;
    if (features.length > 1) {
      showFeatureSelectionUI(features, e.latlng);
    } else if (features.length === 1) {
      handleSingleFeature(features[0]);
    }
  }).catch((err: unknown) => console.error('getGeoserverData error', err));
}
