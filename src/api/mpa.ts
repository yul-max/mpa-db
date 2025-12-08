import api from './index';
export const fetchMPAs = (params: any) => api.get('/mpas', { params });
export const fetchMPA = (id: string) => api.get(`/mpas/${id}`);
export const createMPA = (data: any) => api.post('/mpas', data);
export const updateMPA = (id: string, data: any) => api.put(`/mpas/${id}`, data);
export const deleteMPA = (id: string) => api.delete(`/mpas/${id}`);
