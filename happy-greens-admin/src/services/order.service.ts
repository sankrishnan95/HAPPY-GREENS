import api, { API_BASE_URL } from './api';
import { getToken } from '../utils/auth';
import { AxiosResponse } from 'axios';

export const getOrders = (status: string, extraParams: any = {}): Promise<AxiosResponse> =>
    api.get('/admin/orders', { params: { status: status === 'all' ? undefined : status, ...extraParams } });

export const getOrderById = (id: string | number): Promise<AxiosResponse> =>
    api.get(`/admin/orders/${id}`);

export const updateOrderStatus = (id: string | number, status: string, notes?: string): Promise<AxiosResponse> =>
    api.patch(`/admin/orders/${id}/status`, { status, notes });

export const deleteOrder = (id: string | number): Promise<AxiosResponse> =>
    api.delete(`/admin/orders/${id}`);

export const getInvoiceUrl = (orderId: string | number, format: string = 'a4'): string => {
    const token = getToken();
    return `${API_BASE_URL.replace('/api', '')}/api/admin/orders/${orderId}/invoice?format=${format}&token=${token}`;
};
