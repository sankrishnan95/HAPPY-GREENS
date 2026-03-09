import axios from 'axios';

const DEPLOYED_API_BASE_URL = 'https://happy-greens-18n3.onrender.com/api';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || DEPLOYED_API_BASE_URL,
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
                localStorage.removeItem('happy-greens-storage');
            } catch (_) { }

            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
