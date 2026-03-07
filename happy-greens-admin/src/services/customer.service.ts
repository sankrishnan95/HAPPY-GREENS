import api from './api';
import { AxiosResponse } from 'axios';

export const getCustomers = (params?: any): Promise<AxiosResponse> => api.get('/admin/customers', { params });
export const getCustomerById = (id: string | number): Promise<AxiosResponse> => api.get(`/admin/customers/${id}`);
export const getCustomerOrders = (id: string | number): Promise<AxiosResponse> => api.get(`/admin/customers/${id}/orders`);
