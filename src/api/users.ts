import api from './index';

export const fetchUsers = (params: any) => api.get('/users', { params });
export const fetchUser = (id: string | number) => api.get(`/users/${id}`);
export const createUser = (data: any) => api.post('/users', data);
export const updateUser = (id: string | number, data: any) => api.put(`/users/${id}`, data);
export const deleteUser = (id: string | number) => api.delete(`/users/${id}`);
