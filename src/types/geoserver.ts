export interface WMSGetFeatureInfoParams {
  request: string;        // Operation name - "GetFeatureInfo"
  service: string;        // Service type - "WMS"
  srs: string;            // Spatial reference system - "EPSG:4326"
  styles: string;         // Layer styles (empty string in this case)
  transparent: boolean;   // Whether background is transparent
  format: string;         // Image format for map - "image/png"
  bbox: string | undefined; // Bounding box coordinates as string
  width: number | undefined; // Width of the map in pixels
  height: number | undefined; // Height of the map in pixels
  layers: string | undefined;         // Layer names to query
  query_layers: string | undefined;   // Layer names to query for feature info
  info_format: string;    // Format of the feature info response - "application/json"
  feature_count: number;  // Max number of features to return - 50
  x: number;              // X coordinate of the click in pixels
  y: number;              // Y coordinate of the click in pixels
  cql_filter?: string;    // Optional CQL filter expression
}
