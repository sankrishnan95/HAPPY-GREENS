import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { register, login, forgotPassword, resetPassword, googleLogin, firebasePhoneLogin, sendOtp, verifyOtp, sendPhoneVerificationOtp, verifyPhoneVerificationOtp, getProfile, updateProfile, getProfileAddresses, createProfileAddress, updateProfileAddress, deleteProfileAddress, setDefaultProfileAddress } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google', googleLogin);
router.post('/firebase', firebasePhoneLogin);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/profile/addresses', authenticate, getProfileAddresses);
router.post('/profile/addresses', authenticate, createProfileAddress);
router.put('/profile/addresses/:id', authenticate, updateProfileAddress);
router.delete('/profile/addresses/:id', authenticate, deleteProfileAddress);
router.patch('/profile/addresses/:id/default', authenticate, setDefaultProfileAddress);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/phone/send-otp', authenticate, sendPhoneVerificationOtp);
router.post('/phone/verify-otp', authenticate, verifyPhoneVerificationOtp);

export default router;
