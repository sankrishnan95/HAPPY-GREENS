import api from './api';

export type ChatProduct = {
    id: number;
    name: string;
    price: number;
    image_url?: string;
};

export type ChatResponse = {
    intent: 'ORDER_STATUS' | 'DELIVERY_INFO' | 'OFFERS' | 'PRODUCT_SEARCH' | 'CART_HELP' | 'PAYMENT_HELP' | 'UNKNOWN';
    response: string;
    products?: ChatProduct[];
};

export const sendChatMessage = async (message: string) => {
    const response = await api.post<ChatResponse>('/chat', { message });
    return response.data;
};
