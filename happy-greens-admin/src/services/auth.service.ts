import api from './api';
import { AxiosResponse } from 'axios';

export const login = (email: string, password: string): Promise<AxiosResponse> => api.post('/auth/login', { email, password });

export const changePassword = (currentPassword: string, newPassword: string): Promise<AxiosResponse> =>
    api.patch('/auth/change-password', { currentPassword, newPassword });
