import api from './api';
import { AxiosResponse } from 'axios';

export const getProducts = (params?: any): Promise<AxiosResponse> =>
    api.get('/products', { params: { ...params, admin: true } });

export const getProductById = (id: string | number): Promise<AxiosResponse> =>
    api.get(`/products/${id}`, { params: { admin: true } });

export const createProduct = (productData: any): Promise<AxiosResponse> =>
    api.post('/products', productData);

export const updateProduct = (id: string | number, productData: any): Promise<AxiosResponse> =>
    api.put(`/products/${id}`, productData);

export const deleteProduct = (id: string | number): Promise<AxiosResponse> =>
    api.delete(`/products/${id}`);

export const updateProductStatus = (id: string | number, isActive: boolean): Promise<AxiosResponse> =>
    api.patch(`/products/${id}/status`, { isActive });

export const bulkUpdateProductCategory = (productIds: Array<string | number>, categoryId: string | number): Promise<AxiosResponse> =>
    api.patch('/products/bulk-category', { productIds, categoryId });

export const getCategories = (): Promise<AxiosResponse> =>
    api.get('/products/categories');
