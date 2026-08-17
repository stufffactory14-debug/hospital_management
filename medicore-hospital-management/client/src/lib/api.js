import axios from 'axios';
import { clearStoredAuth, getStoredToken } from './authStorage';

const apiBaseUrl = import.meta.env.DEV
  ? '/api'
  : import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && !isAuthRequest) {
      clearStoredAuth();
      window.dispatchEvent(new Event('medicore:auth-expired'));
    }

    return Promise.reject(error);
  }
);

export default api;
