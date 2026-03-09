import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken, removeToken } from '../utils/auth';

export const API_BASE_URL: string = (import.meta as any).env.VITE_API_URL || 'https://happy-greens-18n3.onrender.com';
export const API_URL: string = `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: any) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
