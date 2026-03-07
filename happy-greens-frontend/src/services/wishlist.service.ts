import api from './api';

export const getWishlist = async () => {
    const { data } = await api.get('/wishlist');
    return data;
};

export const addToWishlist = async (productId: number) => {
    const { data } = await api.post('/wishlist', { productId });
    return data;
};

export const removeFromWishlist = async (productId: number) => {
    await api.delete(`/wishlist/${productId}`);
};
