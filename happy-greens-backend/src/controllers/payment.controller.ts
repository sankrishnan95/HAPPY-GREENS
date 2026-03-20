import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID || '',
    key_secret: RAZORPAY_KEY_SECRET || ''
});

export const createRazorpayOrder = async (req: Request, res: Response) => {
    const { amount } = req.body;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        return res.status(500).json({ message: 'Razorpay is not configured on server' });
    }

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        return res.status(400).json({ message: 'Valid amount is required' });
    }

    try {
        const options = {
            amount: Math.round(normalizedAmount * 100),
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            payment_capture: 1,
        };
        const order = await razorpay.orders.create(options);
        res.json({
            key: RAZORPAY_KEY_ID,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
        });
    } catch (error) {
        console.error('Razorpay order creation failed:', error);
        res.status(500).json({ message: 'Razorpay error' });
    }
};

export const verifyRazorpaySignature = async (req: Request, res: Response) => {
    if (!RAZORPAY_KEY_SECRET) {
        return res.status(500).json({ message: 'Razorpay is not configured on server' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET || '')
        .update(body.toString())
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ status: 'failure', message: 'Invalid payment signature' });
    }

    try {
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        return res.json({
            status: 'success',
            payment: {
                id: payment.id,
                order_id: payment.order_id,
                method: payment.method,
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                email: payment.email,
                contact: payment.contact,
            },
        });
    } catch (error) {
        console.error('Razorpay payment fetch failed:', error);
        return res.status(500).json({ status: 'failure', message: 'Failed to fetch payment details' });
    }
};
