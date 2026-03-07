import api from './api';
import { AxiosResponse } from 'axios';

export const getDeliveries = (status?: string): Promise<AxiosResponse> => {
    const params = status && status !== 'all' ? { status } : {};
    return api.get('/admin/deliveries', { params });
};

export const updateDeliveryStatus = (id: string | number, delivery_status: string, notes?: string): Promise<AxiosResponse> =>
    api.patch(`/admin/deliveries/${id}/status`, { delivery_status, notes });
