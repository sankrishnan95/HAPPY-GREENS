import api from './api';

export const login = async (credentials: any) => {
    const { data } = await api.post('/auth/login', credentials);
    return data;
};

export const register = async (userData: any) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
};

export const googleLogin = async (token: string) => {
    const { data } = await api.post('/auth/google', { token });
    return data;
};

export const firebasePhoneLogin = async (idToken: string) => {
    const { data } = await api.post('/auth/firebase', { idToken });
    return data;
};

export const getProfile = async () => {
    const { data } = await api.get('/auth/profile');
    return data;
};

export const updateProfile = async (payload: { full_name: string; phone: string }) => {
    const { data } = await api.put('/auth/profile', payload);
    return data;
};

export type SavedAddress = {
    id: number;
    label: string;
    full_name: string;
    phone: string;
    address_line: string;
    locality?: string | null;
    landmark?: string | null;
    city: string;
    state?: string | null;
    zip: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
};

export type AddressPayload = {
    label: string;
    full_name: string;
    phone: string;
    address_line: string;
    locality: string;
    landmark: string;
    city: string;
    state: string;
    zip: string;
    is_default: boolean;
};

export const getProfileAddresses = async () => {
    const { data } = await api.get('/auth/profile/addresses');
    return data as { addresses: SavedAddress[] };
};

export const createProfileAddress = async (payload: AddressPayload) => {
    const { data } = await api.post('/auth/profile/addresses', payload);
    return data as { addresses: SavedAddress[] };
};

export const updateProfileAddress = async (id: number, payload: AddressPayload) => {
    const { data } = await api.put(`/auth/profile/addresses/${id}`, payload);
    return data as { addresses: SavedAddress[] };
};

export const deleteProfileAddress = async (id: number) => {
    const { data } = await api.delete(`/auth/profile/addresses/${id}`);
    return data as { addresses: SavedAddress[] };
};

export const setDefaultProfileAddress = async (id: number) => {
    const { data } = await api.patch(`/auth/profile/addresses/${id}/default`);
    return data as { addresses: SavedAddress[] };
};

export const forgotPassword = async (email: string) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
};

export const resetPassword = async (payload: { token: string; password: string }) => {
    const { data } = await api.post('/auth/reset-password', payload);
    return data;
};

export const sendOtp = async (phone: string) => {
    const { data } = await api.post('/auth/send-otp', { phone });
    return data;
};

export const verifyOtp = async (phone: string, otp: string) => {
    const { data } = await api.post('/auth/verify-otp', { phone, otp });
    return data;
};

export const sendPhoneVerificationOtp = async (phone: string) => {
    const { data } = await api.post('/auth/phone/send-otp', { phone });
    return data;
};

export const verifyPhoneVerificationOtp = async (phone: string, otp: string) => {
    const { data } = await api.post('/auth/phone/verify-otp', { phone, otp });
    return data;
};
