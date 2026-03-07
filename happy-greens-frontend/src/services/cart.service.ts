import api from './api';

export const getCart = async () => {
    const { data } = await api.get('/cart');
    return data;
};

export const addToCart = async (productId: number, quantity: number) => {
    const { data } = await api.post('/cart', { productId, quantity });
    return data;
};

export const updateCartItem = async (productId: number, quantity: number) => {
    const { data } = await api.put(`/cart/${productId}`, { quantity });
    return data;
};

export const removeFromCart = async (productId: number) => {
    const { data } = await api.delete(`/cart/${productId}`);
    return data;
};

export const clearCart = async () => {
    const { data } = await api.delete('/cart');
    return data;
};
