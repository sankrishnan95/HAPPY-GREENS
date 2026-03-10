import { API_BASE_URL } from '../config/api';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80';

const normalizeProtocol = (value: string): string => {
    const raw = value.trim();
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^https\/\//i.test(raw)) return raw.replace(/^https\/\//i, 'https://');
    if (/^http\/\//i.test(raw)) return raw.replace(/^http\/\//i, 'http://');
    if (/^\/\/[^/]/.test(raw)) return `https:${raw}`;
    return raw;
};

export const normalizeImageUrl = (value?: string | null, fallback: string = FALLBACK_IMAGE): string => {
    if (!value) return fallback;

    const raw = normalizeProtocol(String(value));
    if (!raw) return fallback;

    if (raw.startsWith('data:') || raw.startsWith('blob:')) {
        return raw;
    }

    if (raw.startsWith('http://localhost') || raw.startsWith('https://localhost')) {
        try {
            const parsed = new URL(raw);
            return `${API_BASE_URL}${parsed.pathname}`;
        } catch {
            return fallback;
        }
    }

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
        return raw;
    }

    if (raw.startsWith('/uploads/')) {
        return `${API_BASE_URL}${raw}`;
    }

    if (raw.startsWith('uploads/')) {
        return `${API_BASE_URL}/${raw}`;
    }

    if (raw.startsWith('/')) {
        return `${API_BASE_URL}${raw}`;
    }

    // Plain filename -> assume backend uploads directory
    return `${API_BASE_URL}/uploads/${raw}`;
};
