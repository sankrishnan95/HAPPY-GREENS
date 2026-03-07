import api from './api';
import { AxiosResponse } from 'axios';

export const getCoupons = (): Promise<AxiosResponse> => api.get('/admin/coupons');
export const createCoupon = (data: any): Promise<AxiosResponse> => api.post('/admin/coupons', data);
export const updateCoupon = (id: string | number, data: any): Promise<AxiosResponse> => api.put(`/admin/coupons/${id}`, data);
export const deleteCoupon = (id: string | number): Promise<AxiosResponse> => api.delete(`/admin/coupons/${id}`);
