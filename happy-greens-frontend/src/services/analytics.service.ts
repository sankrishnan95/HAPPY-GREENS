import { API_BASE_URL } from '../config/api';
import { trackGaEvent, trackGaPageView } from '../lib/monitoring/ga';
import { captureFrontendException } from '../lib/monitoring/sentry';

interface BaseEventPayload {
    page?: string;
    product_id?: number | string;
    product_name?: string;
    quantity?: number;
    price?: number;
    order_id?: number | string;
    total?: number;
    coupon?: string;
    item_count?: number;
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

const postInternalEvent = (eventType: string, data: BaseEventPayload = {}) => {
    if (typeof window === 'undefined' || !eventType) return;

    const token = getToken();

    void fetch(`${API_BASE_URL}/analytics/track`, {
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
    }).catch((error) => {
        captureFrontendException(error, { eventType, scope: 'internal_analytics_post' });
    });
};

export const trackPageView = (path: string) => {
    trackGaPageView(path);
    postInternalEvent('page_view', { page: path });
};

export const trackAddToCart = (payload: BaseEventPayload = {}) => {
    trackGaEvent('add_to_cart', {
        currency: 'INR',
        value: payload.price ?? 0,
        items: [
            {
                item_id: payload.product_id,
                item_name: payload.product_name,
                price: payload.price,
                quantity: payload.quantity ?? 1,
            },
        ],
    });
    postInternalEvent('add_to_cart', payload);
};

export const trackCheckoutStarted = (payload: BaseEventPayload = {}) => {
    trackGaEvent('begin_checkout', {
        currency: 'INR',
        value: payload.total ?? 0,
        coupon: payload.coupon,
        items: payload.item_count,
    });
    postInternalEvent('checkout_start', payload);
};

export const trackOrderCompleted = (payload: BaseEventPayload = {}) => {
    trackGaEvent('purchase', {
        transaction_id: payload.order_id,
        currency: 'INR',
        value: payload.total ?? 0,
        coupon: payload.coupon,
    });
    postInternalEvent('order_completed', payload);
};

export const trackEvent = (eventType: string, data: BaseEventPayload = {}) => {
    switch (eventType) {
        case 'page_view':
            trackPageView(data.page || '/');
            break;
        case 'add_to_cart':
            trackAddToCart(data);
            break;
        case 'checkout_start':
            trackCheckoutStarted(data);
            break;
        case 'order_completed':
            trackOrderCompleted(data);
            break;
        default:
            trackGaEvent(eventType, data as Record<string, unknown>);
            postInternalEvent(eventType, data);
    }
};
