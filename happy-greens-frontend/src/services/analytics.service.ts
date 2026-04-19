import { trackGaEvent, trackGaPageView } from '../lib/monitoring/ga';

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

export const trackPageView = (path: string) => {
    trackGaPageView(path);
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
};

export const trackCheckoutStarted = (payload: BaseEventPayload = {}) => {
    trackGaEvent('begin_checkout', {
        currency: 'INR',
        value: payload.total ?? 0,
        coupon: payload.coupon,
        items: payload.item_count,
    });
};

export const trackOrderCompleted = (payload: BaseEventPayload = {}) => {
    trackGaEvent('purchase', {
        transaction_id: payload.order_id,
        currency: 'INR',
        value: payload.total ?? 0,
        coupon: payload.coupon,
    });
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
    }
};
