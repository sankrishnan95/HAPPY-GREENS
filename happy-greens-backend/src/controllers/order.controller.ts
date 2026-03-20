import { Request, Response } from 'express';
import { pool } from '../db';
import { calculateOrderTotals } from '../services/order-pricing.service';

const getExistingOrderByToken = async (userId: number, clientOrderToken: string) => {
    const existing = await pool.query(
        'SELECT id, total_amount, points_used FROM orders WHERE user_id = $1 AND client_order_token = $2 LIMIT 1',
        [userId, clientOrderToken]
    );

    return existing.rows[0] || null;
};

export const createOrder = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user?.id;
    const {
        items,
        shippingAddress,
        paymentIntentId,
        paymentMethod,
        paymentDetails,
        pointsUsed = 0,
        clientOrderToken,
    } = req.body;

    const sanitizedClientOrderToken = typeof clientOrderToken === 'string' && clientOrderToken.trim().length > 0
        ? clientOrderToken.trim().slice(0, 64)
        : null;

    if (sanitizedClientOrderToken) {
        const existingOrder = await getExistingOrderByToken(userId, sanitizedClientOrderToken);
        if (existingOrder) {
            return res.status(200).json({
                orderId: existingOrder.id,
                message: 'Order already created',
                pointsUsed: Number(existingOrder.points_used || 0),
                discount: Number(existingOrder.points_used || 0),
                finalTotal: Number(existingOrder.total_amount),
                duplicate: true,
            });
        }
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const shippingAddressPayload = shippingAddress && typeof shippingAddress === 'object' ? shippingAddress : {};
        const address = typeof shippingAddressPayload.address === 'string' ? shippingAddressPayload.address.trim().slice(0, 255) : '';
        const city = typeof shippingAddressPayload.city === 'string' ? shippingAddressPayload.city.trim().slice(0, 100) : '';
        const zip = typeof shippingAddressPayload.zip === 'string' ? shippingAddressPayload.zip.trim().slice(0, 20) : '';
        if (!address || !city || !zip) {
            throw new Error('INVALID_SHIPPING');
        }

        if (paymentMethod !== 'cod' && paymentMethod !== 'razorpay') {
            throw new Error('INVALID_PAYMENT_METHOD');
        }

        const { items: pricedItems, validatedPointsUsed, finalTotal } = await calculateOrderTotals(
            client,
            items,
            pointsUsed,
            userId
        );

        const orderStatus = paymentMethod === 'cod' ? 'placed' : 'paid';

        const orderRes = await client.query(
            `INSERT INTO orders
               (user_id, total_amount, status, payment_method, payment_intent_id, shipping_address, points_used, client_order_token)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [userId, finalTotal, orderStatus, paymentMethod, paymentIntentId, JSON.stringify({ address, city, zip }), validatedPointsUsed, sanitizedClientOrderToken]
        );
        const orderId = orderRes.rows[0].id;

        if (paymentMethod === 'razorpay' && paymentIntentId) {
            const gatewayOrderId = typeof paymentDetails?.orderId === 'string' ? paymentDetails.orderId : null;
            const paymentMethodType = typeof paymentDetails?.method === 'string' ? paymentDetails.method : 'unknown';
            const paymentStatus = typeof paymentDetails?.status === 'string' ? paymentDetails.status : 'succeeded';
            const paymentCurrency = typeof paymentDetails?.currency === 'string' ? paymentDetails.currency : 'INR';

            await client.query(
                `INSERT INTO payments
                   (order_id, user_id, amount, currency, payment_gateway, payment_status, gateway_payment_id, gateway_order_id, payment_method_type, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    orderId,
                    userId,
                    finalTotal,
                    paymentCurrency,
                    'razorpay',
                    paymentStatus,
                    paymentIntentId,
                    gatewayOrderId,
                    paymentMethodType,
                    JSON.stringify(paymentDetails || {}),
                ]
            );
        }

        for (const item of pricedItems) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase) VALUES ($1, $2, $3, $4, $5)',
                [orderId, item.product_id, item.product_name, item.quantity, item.price]
            );
        }

        await client.query(
            'INSERT INTO order_status_history (order_id, old_status, new_status, notes) VALUES ($1, $2, $3, $4)',
            [orderId, null, orderStatus, 'Order placed by customer']
        );

        if (validatedPointsUsed > 0) {
            await client.query(
                `UPDATE users
                 SET loyalty_points = loyalty_points - $1,
                     total_points_redeemed = total_points_redeemed + $1
                 WHERE id = $2`,
                [validatedPointsUsed, userId]
            );

            await client.query(
                `INSERT INTO loyalty_transactions (user_id, order_id, type, points, description)
                 VALUES ($1, $2, 'redeemed', $3, $4)`,
                [userId, orderId, -validatedPointsUsed, `Points redeemed on Order #${orderId}`]
            );
        }

        await client.query('DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)', [userId]);

        await client.query('COMMIT');
        res.status(201).json({
            orderId,
            message: 'Order created successfully',
            pointsUsed: validatedPointsUsed,
            discount: validatedPointsUsed,
            finalTotal,
        });
    } catch (error: any) {
        await client.query('ROLLBACK');

        if (error?.message === 'INVALID_SHIPPING') {
            return res.status(400).json({ message: 'Valid shipping address is required' });
        }
        if (error?.message === 'INVALID_PAYMENT_METHOD') {
            return res.status(400).json({ message: 'Invalid payment method' });
        }
        if (error?.message === 'INVALID_ITEMS' || error?.message === 'INVALID_PRODUCT') {
            return res.status(400).json({ message: 'Invalid order items' });
        }

        if (error?.code === '23505' && sanitizedClientOrderToken) {
            const existingOrder = await getExistingOrderByToken(userId, sanitizedClientOrderToken);
            if (existingOrder) {
                return res.status(200).json({
                    orderId: existingOrder.id,
                    message: 'Order already created',
                    pointsUsed: Number(existingOrder.points_used || 0),
                    discount: Number(existingOrder.points_used || 0),
                    finalTotal: Number(existingOrder.total_amount),
                    duplicate: true,
                });
            }
        }

        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

export const getOrders = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user?.id;
    try {
        const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getOrderById = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user?.id;
    const { id } = req.params;

    try {
        const orderResult = await pool.query(
            'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orderResult.rows[0];

        const itemsResult = await pool.query(
            `SELECT oi.*, p.image_url
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = $1`,
            [id]
        );

        const timelineResult = await pool.query(
            `SELECT osh.id, osh.old_status, osh.new_status, osh.notes, osh.changed_at
             FROM order_status_history osh
             WHERE osh.order_id = $1
             ORDER BY osh.changed_at DESC`,
            [id]
        );

        const placedEvent = {
            id: 0,
            old_status: null,
            new_status: 'placed',
            notes: 'Order was placed',
            changed_at: order.created_at
        };

        res.json({
            ...order,
            items: itemsResult.rows,
            timeline: [...timelineResult.rows, placedEvent]
        });
    } catch (error) {
        console.error('Error fetching order by id:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
