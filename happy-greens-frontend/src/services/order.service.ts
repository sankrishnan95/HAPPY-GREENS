import api from './api';

export const createOrder = async (orderData: any) => {
    const { data } = await api.post('/orders', orderData);
    return data;
};

export const getOrders = async () => {
    const { data } = await api.get('/orders');
    return data;
};

export const getOrderById = async (id: string | number) => {
    const { data } = await api.get(`/orders/${id}`);
    return data;
};
