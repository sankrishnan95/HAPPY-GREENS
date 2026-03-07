import api from './api';

export const uploadImages = async (formData: FormData): Promise<any> => {
    const { data } = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return data;
};
