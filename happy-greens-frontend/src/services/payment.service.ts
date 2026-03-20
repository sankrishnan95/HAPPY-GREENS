import api from './api';

export const createRazorpayOrder = async (amount: number) => {
    const { data } = await api.post('/payments/razorpay/order', { amount });
    return data;
};

export const verifyRazorpayPayment = async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}) => {
    const { data } = await api.post('/payments/razorpay/verify', payload);
    return data;
};
