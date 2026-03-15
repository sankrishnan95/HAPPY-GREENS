import axios from 'axios';
import { useStore } from '../store/useStore';

const DEPLOYED_API_BASE_URL = 'https://happy-greens-18n3.onrender.com/api';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEPLOYED_API_BASE_URL;
export const API_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

// Automatically attach token from Zustand persisted store
api.interceptors.request.use((config) => {
    try {
        const stored = localStorage.getItem('happy-greens-storage');
        if (stored) {
            const { state } = JSON.parse(stored);
            const token = state?.token;
            if (typeof token === 'string' && token.trim().length > 0) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
    } catch (_) { }
    return config;
});

// If backend rejects token, clear persisted auth so user can re-login cleanly.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const message = (error?.response?.data?.message || '').toLowerCase();

        if (status === 401 && (message.includes('token') || message.includes('authorization'))) {
            try {
                useStore.getState().logout();
            } catch (_) { }

            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.dispatchEvent(new CustomEvent('auth:expired'));
            }
        }

        return Promise.reject(error);
    }
);

export const checkBackendHealth = async (signal?: AbortSignal) => {
    const response = await fetch(`${API_ROOT_URL}/api/health`, {
        method: 'GET',
        signal,
        cache: 'no-store',
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`);
    }

    return response.json();
};

export default api;
