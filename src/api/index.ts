import axios from 'axios';
import { useAuthStore } from '@/stores/auth';


const api = axios.create({
  baseURL: import.meta.env.VITE_LOCALE_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];


const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};


api.interceptors.request.use((config) => {
  try {
    const auth = useAuthStore();
    if (auth.accessToken) {
      // cast to any to avoid AxiosHeaders typing incompatibility across axios versions
      // we only intend to set Authorization header here
      (config as any).headers = { ...(config as any).headers, Authorization: `Bearer ${auth.accessToken}` };
    }
  } catch (e) { }
  return config;
});

api.interceptors.response.use(
  res => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => { failedQueue.push({ resolve, reject }); })
          .then((token) => { original.headers.Authorization = `Bearer ${token}`; return api(original); });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const resp = await api.post('/auth/refresh');
        const token = resp.data.accessToken;
        const auth = useAuthStore();
        auth.setAccessToken(token);
        processQueue(null, token);
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        const auth = useAuthStore();
        auth.logout();
        return Promise.reject(err);
      } finally { isRefreshing = false; }
    }
    return Promise.reject(error);
  }
);


export default api;
