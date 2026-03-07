import api from './api';

export const getActiveBanners = async () => {
    const { data } = await api.get('/banners/active');
    return data;
};
