import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { register, login, forgotPassword, resetPassword, googleLogin, sendOtp, verifyOtp, sendPhoneVerificationOtp, verifyPhoneVerificationOtp } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google', googleLogin);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/phone/send-otp', authenticate, sendPhoneVerificationOtp);
router.post('/phone/verify-otp', authenticate, verifyPhoneVerificationOtp);

export default router;
