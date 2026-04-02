import { Router } from 'express';
import { handleMsg91Webhook, handleRazorpayWebhook } from '../controllers/webhook.controller';

const router = Router();

/**
 * Webhook Routes
 * 
 * IMPORTANT: These routes are PUBLIC (no authentication required)
 * Security is handled via signature verification in the controllers
 */

/**
 * Razorpay Webhook Endpoint
 * 
 * POST /api/webhooks/razorpay
 * 
 * Headers:
 *   x-razorpay-signature: HMAC SHA256 signature
 * 
 * Body: Razorpay webhook payload (raw body required for signature verification)
 * 
 * Events handled:
 *   - payment.captured (only this event marks order as paid)
 * 
 * Currency: INR only
 */
router.post('/razorpay', handleRazorpayWebhook);
router.get('/msg91', handleMsg91Webhook);
router.post('/msg91', handleMsg91Webhook);

export default router;
