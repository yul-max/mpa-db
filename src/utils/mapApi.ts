// Map API helpers that use the app's API layer.
import { fetchMPAs, fetchMPA } from '@/api/mpa';

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

export async function getGeoserverData(params: any): Promise<any[]> {
  // If your backend exposes a geoserver proxy endpoint, call it here.
  // Fallback: attempt to fetch MPAs filtered by params.
  try {
    const resp = await fetchMPAs(params);
    return resp.data?.features || [];
  } catch (err) {
    console.error('getGeoserverData error', err);
    return [];
  }
}
