// Map API helpers that use the app's API layer.
import { fetchMPAs } from '@/api/mpa';
import type { WMSGetFeatureInfoParams } from '@/types/map';

const PUBLIC_GEOSERVER_URL = (import.meta.env.PUBLIC_GEOSERVER_URL || import.meta.env.VITE_GEOSERVER_URL) as string | undefined;

export async function getMapData(params?: any): Promise<any> {
  try {
    const resp = await fetchMPAs(params);
    return resp.data;
  } catch (err) {
    console.error('getMapData error', err);
    return { type: 'FeatureCollection', features: [] };
  }
}

export async function getDetailedMapData(params?: any): Promise<any[]> {
  try {
    const resp = await fetchMPAs({ ...params, detailed: true });
    // assume API returns array for detailed when `detailed` flag is used
    return resp.data || [];
  } catch (err) {
    console.error('getDetailedMapData error', err);
    return [];
  }
}

export async function getGeoserverData(params: WMSGetFeatureInfoParams) {
  // Convert params object to URL search parameters
  const searchParams = new URLSearchParams();

  // Add all params to the search parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString());
    }
  });
  const url = `${PUBLIC_GEOSERVER_URL}/mpad_Geoserver/wms?${searchParams.toString()}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      // Transform flattened properties to remove prefixes

      const transformedData = data.features.map((feature: any) => {
        const transformedProperties: Record<string, any> = {};
        for (const [key, value] of Object.entries(feature.properties)) {
          if (key.startsWith('properties.')) {
            // Remove the 'properties.' prefix
            transformedProperties[key.replace('properties.', '')] = value;
          } else {
            transformedProperties[key] = value;
          }
        }
        return {
          ...feature,
          properties: transformedProperties
        }
      })

      return transformedData;
    }
    return null;
  } catch (error) {
    console.error('Error getting feature info:', error);
    return null;
  }
}
