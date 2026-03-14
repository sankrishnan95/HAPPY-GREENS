import api from './api';
import { AxiosResponse } from 'axios';

const buildAnalyticsParams = (range: string, customRange?: { from?: string; to?: string }) => ({
  range,
  ...(range === 'custom' ? customRange : {}),
});

export const getRevenueAnalytics = (): Promise<AxiosResponse> => api.get('/admin/analytics/revenue');
export const getOrdersAnalytics = (): Promise<AxiosResponse> => api.get('/admin/analytics/orders');
export const getCustomerAnalytics = (): Promise<AxiosResponse> => api.get('/admin/analytics/customers');
export const getProductAnalytics = (): Promise<AxiosResponse> => api.get('/admin/analytics/products');
export const getDashboardAnalytics = (timeFilter: string): Promise<AxiosResponse> => api.get('/admin/analytics/dashboard', { params: { timeFilter } });

export const getSalesAnalytics = (range = '7d', customRange?: { from?: string; to?: string }): Promise<AxiosResponse> => api.get('/admin/analytics/sales', { params: buildAnalyticsParams(range, customRange) });
export const getDetailedProductAnalytics = (range = '7d', customRange?: { from?: string; to?: string }): Promise<AxiosResponse> => api.get('/admin/analytics/products/insights', { params: buildAnalyticsParams(range, customRange) });
export const getDetailedCustomerAnalytics = (range = '7d', customRange?: { from?: string; to?: string }): Promise<AxiosResponse> => api.get('/admin/analytics/customers/insights', { params: buildAnalyticsParams(range, customRange) });
export const getDetailedOrderAnalytics = (range = '7d', customRange?: { from?: string; to?: string }): Promise<AxiosResponse> => api.get('/admin/analytics/orders/insights', { params: buildAnalyticsParams(range, customRange) });
export const getInventoryInsights = (range = '7d', customRange?: { from?: string; to?: string }): Promise<AxiosResponse> => api.get('/admin/analytics/inventory', { params: buildAnalyticsParams(range, customRange) });
export const getTrafficAnalytics = (range = '7d', customRange?: { from?: string; to?: string }): Promise<AxiosResponse> => api.get('/admin/analytics/traffic', { params: buildAnalyticsParams(range, customRange) });
