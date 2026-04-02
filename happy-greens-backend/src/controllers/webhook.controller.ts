import { Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../db';

const parseWebhookPayload = (req: Request) => {
    if (Buffer.isBuffer(req.body)) {
        const raw = req.body.toString('utf-8').trim();
        if (!raw) return {};
        try {
            return JSON.parse(raw);
        } catch (_) {
            return {};
        }
    }

    if (req.body && typeof req.body === 'object') {
        return req.body;
    }

    return {};
};

/**
 * Razorpay Webhook Handler
 * Verifies webhook signature and processes payment success
 * 
 * POST /api/webhooks/razorpay
 * Body: Razorpay webhook payload (raw body required for signature verification)
 * Headers: x-razorpay-signature
 * 
 * Business Rules:
 * - Only processes payment.captured events
 * - Only accepts INR currency
 * - Uses timing-safe signature comparison
 */
export const handleRazorpayWebhook = async (req: Request, res: Response) => {
    try {
        const signature = req.headers['x-razorpay-signature'] as string;
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('RAZORPAY_WEBHOOK_SECRET not configured');
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }

        if (!signature) {
            console.error('Missing Razorpay signature header');
            return res.status(400).json({ error: 'Missing signature' });
        }

        // Get raw body for signature verification
        // req.body should be raw buffer when using express.raw() middleware
        const rawBody = req.body.toString('utf-8');

        // Verify webhook signature using raw body
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');

        // Use timing-safe comparison to prevent timing attacks
        const signatureBuffer = Buffer.from(signature, 'utf-8');
        const expectedSignatureBuffer = Buffer.from(expectedSignature, 'utf-8');

        if (signatureBuffer.length !== expectedSignatureBuffer.length ||
            !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
            console.error('Invalid Razorpay webhook signature');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // Parse the verified payload
        const webhookData = JSON.parse(rawBody);
        const event = webhookData.event;
        const payload = webhookData.payload;

        console.log(`Razorpay webhook received: ${event}`);

        // Only process payment.captured events
        if (event === 'payment.captured') {
            const paymentEntity = payload.payment.entity;
            const orderId = paymentEntity.notes?.order_id; // Order ID from notes
            const razorpayPaymentId = paymentEntity.id;
            const razorpayOrderId = paymentEntity.order_id;
            const amount = paymentEntity.amount / 100; // Convert paise to rupees
            const currency = paymentEntity.currency;
            const paymentMethod = paymentEntity.method;

            // Validate currency is INR only
            if (currency !== 'INR') {
                console.error(`Invalid currency: ${currency}. Only INR accepted.`);
                return res.status(400).json({ error: 'Only INR currency accepted' });
            }

            if (!orderId) {
                console.error('Order ID not found in payment notes');
                return res.status(400).json({ error: 'Order ID missing' });
            }

            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // Check if order exists and lock row for update
                const orderResult = await client.query(
                    'SELECT id, user_id, status FROM orders WHERE id = $1 FOR UPDATE',
                    [orderId]
                );

                if (orderResult.rows.length === 0) {
                    await client.query('ROLLBACK');
                    console.error(`Order ${orderId} not found`);
                    return res.status(404).json({ error: 'Order not found' });
                }

                const order = orderResult.rows[0];

                // Check if order is already paid (bulletproof safety)
                if (order.status === 'paid') {
                    await client.query('ROLLBACK');
                    console.log(`Order ${orderId} is already paid, ignoring duplicate payment`);
                    return res.status(200).json({ status: 'order_already_paid' });
                }

                // Check if payment already processed (idempotency by payment ID)
                const existingPayment = await client.query(
                    'SELECT id FROM payments WHERE gateway_payment_id = $1',
                    [razorpayPaymentId]
                );

                if (existingPayment.rows.length > 0) {
                    await client.query('ROLLBACK');
                    console.log(`Payment ${razorpayPaymentId} already processed`);
                    return res.status(200).json({ status: 'already_processed' });
                }

                // Insert payment record
                await client.query(
                    `INSERT INTO payments 
                    (order_id, user_id, amount, currency, payment_gateway, payment_status, 
                     gateway_payment_id, gateway_order_id, payment_method_type, metadata) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [
                        orderId,
                        order.user_id,
                        amount,
                        currency,
                        'razorpay',
                        'succeeded',
                        razorpayPaymentId,
                        razorpayOrderId,
                        paymentMethod,
                        JSON.stringify(paymentEntity)
                    ]
                );

                // Update order status to paid
                await client.query(
                    'UPDATE orders SET status = $1, payment_method = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
                    ['paid', 'razorpay', orderId]
                );

                await client.query('COMMIT');
                console.log(`Payment processed successfully for order ${orderId}`);

                res.status(200).json({ status: 'success' });
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Error processing Razorpay webhook:', error);
                res.status(500).json({ error: 'Internal server error' });
            } finally {
                client.release();
            }
        } else {
            // Acknowledge other events but don't process them
            console.log(`Razorpay event ${event} received but not processed (only payment.captured is handled)`);
            res.status(200).json({ status: 'event_not_handled' });
        }
    } catch (error) {
        console.error('Razorpay webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const handleMsg91Webhook = async (req: Request, res: Response) => {
    try {
        const payload = parseWebhookPayload(req);
        const combined = {
            ...req.query,
            ...payload,
        } as Record<string, unknown>;

        const requestId = String(
            combined.request_id ??
            combined.requestId ??
            combined.req_id ??
            ''
        );
        const mobile = String(
            combined.mobile ??
            combined.mobiles ??
            combined.msisdn ??
            ''
        );
        const status = String(
            combined.status ??
            combined.type ??
            combined.delivery_status ??
            combined.response ??
            'unknown'
        );
        const description = String(
            combined.description ??
            combined.reason ??
            combined.message ??
            ''
        );

        console.log(
            `[MSG91 Webhook] requestId=${requestId || 'n/a'} mobile=${mobile || 'n/a'} status=${status}${description ? ` reason=${description}` : ''}`
        );

        return res.status(200).json({ status: 'received' });
    } catch (error) {
        console.error('[MSG91 Webhook] Error handling webhook:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
