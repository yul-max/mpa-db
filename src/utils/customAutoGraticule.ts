import AutoGraticule from 'leaflet-auto-graticule';
import type { PolylineOptions } from 'leaflet';

export default class CustomAutoGraticule extends AutoGraticule {
  lineStyle: PolylineOptions = {
    stroke: true,
    color: '#000000',
    opacity: 0.8,
    weight: 2,
    interactive: false
  };

  constructor(options?: any) {
    super(options);
  }
}
