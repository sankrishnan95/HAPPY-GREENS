import api from './api';

export const getActiveCoupons = async () => {
    const { data } = await api.get('/coupons/active');
    return data;
};
