import api from './api';

let bannersCache: any = null;
let bannersPromise: Promise<any> | null = api.get('/banners/active')
    .then((res: any) => {
        bannersCache = res.data;
        return res.data;
    })
    .catch((err: any) => {
        console.error('Initial banner prefetch failed', err);
        return null;
    });

export const getActiveBanners = async () => {
    if (bannersCache) return bannersCache;
    if (bannersPromise) {
        const result = await bannersPromise;
        if (result) return result;
    }
    
    const { data } = await api.get('/banners/active');
    return data;
};
