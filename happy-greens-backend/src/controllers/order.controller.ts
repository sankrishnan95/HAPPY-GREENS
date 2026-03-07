import { Request, Response } from 'express';
import { pool } from '../db';

export const createOrder = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user?.id;
    const { items, totalAmount, shippingAddress, paymentIntentId, paymentMethod, pointsUsed = 0 } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // ── Loyalty Points Redemption Validation ────────────────────
        let finalTotal = Number(totalAmount);
        let validatedPointsUsed = 0;

        if (pointsUsed > 0) {
            // Fetch current loyalty balance
            const userRes = await client.query(
                'SELECT loyalty_points FROM users WHERE id = $1',
                [userId]
            );
            const availablePoints = userRes.rows[0]?.loyalty_points || 0;

            // Cap: cannot use more than available, and max 50% discount
            const maxRedeemable = Math.floor(finalTotal * 0.5);
            validatedPointsUsed = Math.min(pointsUsed, availablePoints, maxRedeemable);

            if (validatedPointsUsed > 0) {
                finalTotal = Math.max(0, finalTotal - validatedPointsUsed);
                // Deduct from user immediately
                await client.query(
                    `UPDATE users
                     SET loyalty_points = loyalty_points - $1,
                         total_points_redeemed = total_points_redeemed + $1
                     WHERE id = $2`,
                    [validatedPointsUsed, userId]
                );
            }
        }
        // ── End Loyalty Points Validation ───────────────────────────

        const orderStatus = paymentMethod === 'cod' ? 'placed' : 'paid';

        const orderRes = await client.query(
            `INSERT INTO orders
               (user_id, total_amount, status, payment_method, payment_intent_id, shipping_address, points_used)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [userId, finalTotal, orderStatus, paymentMethod, paymentIntentId, JSON.stringify(shippingAddress), validatedPointsUsed]
        );
        const orderId = orderRes.rows[0].id;

        for (const item of items) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase) VALUES ($1, $2, $3, $4, $5)',
                [orderId, item.product_id, item.product_name, item.quantity, item.price]
            );
        }

        // Log initial order placement in order_status_history
        await client.query(
            'INSERT INTO order_status_history (order_id, old_status, new_status, notes) VALUES ($1, $2, $3, $4)',
            [orderId, null, orderStatus, 'Order placed by customer']
        );

        // Record loyalty redemption transaction
        if (validatedPointsUsed > 0) {
            await client.query(
                `INSERT INTO loyalty_transactions (user_id, order_id, type, points, description)
                 VALUES ($1, $2, 'redeemed', $3, $4)`,
                [userId, orderId, -validatedPointsUsed, `Points redeemed on Order #${orderId}`]
            );
        }

        // Clear cart
        await client.query('DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)', [userId]);

        await client.query('COMMIT');
        res.status(201).json({
            orderId,
            message: 'Order created successfully',
            pointsUsed: validatedPointsUsed,
            discount: validatedPointsUsed,
            finalTotal
        });
    } catch (error) {
        await client.query('ROLLBACK');
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
        // Fetch order — ensure it belongs to the authenticated user
        const orderResult = await pool.query(
            'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orderResult.rows[0];

        // Fetch order items with product images
        const itemsResult = await pool.query(
            `SELECT oi.*, p.image_url
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = $1`,
            [id]
        );

        // Fetch timeline from order_status_history
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
