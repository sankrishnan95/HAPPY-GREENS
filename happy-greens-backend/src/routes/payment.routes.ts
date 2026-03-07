import { Router } from 'express';
import { createRazorpayOrder, verifyRazorpaySignature } from '../controllers/payment.controller';

const router = Router();

router.post('/razorpay/order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpaySignature);

export default router;
