import api from './api';

export const getProducts = async (params: any) => {
    const { data } = await api.get('/products', { params });
    return data;
};

export const getProductById = async (id: string | number) => {
    const { data } = await api.get(`/products/${id}`);
    return data;
};

export const getCategories = async (activeOnly: boolean = false) => {
    const { data } = await api.get('/products/categories', { params: { activeOnly: activeOnly ? 'true' : 'false' } });
    return data;
};
