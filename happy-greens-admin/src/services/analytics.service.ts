import api from './api';
import { AxiosResponse } from 'axios';

export const getRevenueAnalytics = (): Promise<AxiosResponse> => api.get('/admin/analytics/revenue');
export const getOrdersAnalytics = (): Promise<AxiosResponse> => api.get('/admin/analytics/orders');
export const getCustomerAnalytics = (): Promise<AxiosResponse> => api.get('/admin/analytics/customers');
export const getProductAnalytics = (): Promise<AxiosResponse> => api.get('/admin/analytics/products');
export const getDashboardAnalytics = (timeFilter: string): Promise<AxiosResponse> => api.get('/admin/analytics/dashboard', { params: { timeFilter } });
