import api from './index';
export const login = (identifier: string, password: string) => api.post('/auth/login', { identifier, password });
export const logout = () => api.post('/auth/logout');
