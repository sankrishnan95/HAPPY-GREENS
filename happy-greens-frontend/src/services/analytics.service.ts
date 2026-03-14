import { API_BASE_URL } from '../config/api';

interface TrackEventPayload {
    page?: string;
    product_id?: number | string;
}

const getToken = () => {
    try {
        const stored = localStorage.getItem('happy-greens-storage');
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        return parsed?.state?.token || null;
    } catch {
        return null;
    }
};

export const trackEvent = (eventType: string, data: TrackEventPayload = {}) => {
    if (typeof window === 'undefined' || !eventType) return;

    const token = getToken();

    void fetch(`${API_BASE_URL}/api/analytics/track`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
            event_type: eventType,
            ...data,
        }),
        keepalive: true,
    }).catch(() => {
        // Analytics failures should never interrupt user flows.
    });
};
