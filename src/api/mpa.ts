import api from './index';
export const fetchMPAs = (params: any) => api.get('/mpas', { params });
export const fetchMPADatalist = (query: any) => api.get('/datalist', { params: query });
export const fetchMPA = (id: string) => api.get(`/datalist/single/${id}`);
export const createMPA = (data: any) => api.post('/mpas', data);
export const updateMPA = (id: string, data: any) => api.put(`/mpas/${id}`, data);
export const deleteMPA = (id: string) => api.delete(`/mpas/${id}`);

/**
 * Upload a shapefile, GeoJSON, or JSON file to create MPA(s)
 * @param file - The file to upload (.zip, .geojson, or .json)
 * @param formData - Form field overrides (complete_name, year_established, etc.)
 * @returns Promise with upload response
 */
export const uploadShapefile = (file: File, formData: Record<string, any>) => {
  const data = new FormData();
  data.append('file', file);

  // Add all form fields as overrides
  Object.keys(formData).forEach(key => {
    const value = formData[key];
    // Filter out empty, null, undefined, and NaN values
    if (value !== null && value !== undefined && value !== '' && !Number.isNaN(value)) {
      if (typeof value === 'object') {
        data.append(key, JSON.stringify(value));
      } else {
        data.append(key, String(value));
      }
    }
  });

  return api.post('/upload/shapefile', data, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * Fetch pending MPAs from upload queue (admin only)
 * @returns Promise with pending MPAs list
 */
export const fetchPendingMPAs = () => api.get('/upload/queue');

/**
 * Fetch a single pending MPA by staging_id (admin only)
 * @param stagingId - The staging ID of the pending MPA
 * @returns Promise with pending MPA details
 */
export const fetchPendingMPA = (stagingId: string | number) => api.get(`/upload/queue/${stagingId}`);

/**
 * Approve a pending MPA (admin only)
 * @param stagingId - The staging ID of the pending MPA to approve
 * @returns Promise with approval result containing new_mpa_id and features_published
 */
export const approvePendingMPA = (stagingId: string | number) => api.put(`/upload/approve/${stagingId}`);

/**
 * Reject a pending MPA (admin only)
 * @param stagingId - The staging ID of the pending MPA to reject
 * @param reason - The reason for rejection
 * @returns Promise with rejection result
 */
export const rejectPendingMPA = (stagingId: string | number, reason: string) =>
  api.put(`/upload/reject/${stagingId}`, { reason });

/**
 * Fetch MPAs uploaded by the current user
 * Returns both staging (pending) and approved MPAs
 * @returns Promise with {success, staging, approved}
 */
export const fetchMyMPAs = () => api.get('/upload/my-mpas');

export const fetchOrdinances = (mpaId: string | number) => api.get(`/ordinance/${mpaId}`);
