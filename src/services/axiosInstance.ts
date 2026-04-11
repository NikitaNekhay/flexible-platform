import axios from 'axios';
import { logout } from '@/store/slices/authSlice';

const axiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Lazy import to avoid circular dependency (store → baseApi → axiosInstance → store)
      const { store } = await import('@/store');
      store.dispatch(logout());
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
