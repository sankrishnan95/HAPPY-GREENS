import api from './api';

export const getBanners = () => api.get('/banners');
export const getBannerById = (id: number | string) => api.get(`/banners/${id}`);
export const createBanner = (bannerData: any) => api.post('/banners', bannerData);
export const updateBanner = (id: number | string, bannerData: any) => api.put(`/banners/${id}`, bannerData);
export const deleteBanner = (id: number | string) => api.delete(`/banners/${id}`);
export const updateBannerStatus = (id: number | string, isActive: boolean) => api.patch(`/banners/${id}/status`, { isActive });
