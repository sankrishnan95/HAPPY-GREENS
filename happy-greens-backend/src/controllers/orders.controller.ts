import { Request, Response } from 'express';
import { pool } from '../db';
import { getPublicBaseUrl, normalizeMediaUrl } from '../utils/media';
import { createUserNotification } from '../services/notification.service';
import { buildUnitConfig, calculateLineTotal } from '../services/unit-pricing.service';

const safelyRunNotificationTask = async (task: () => Promise<void>) => {
    try {
        await task();
    } catch (error) {
        console.warn('[Notifications] Skipping admin status notification due to error:', error);
    }
};

const resolveOriginalLineTotal = (item: any): number => {
    const storedOriginal = Number(item.original_price_at_purchase);
    if (Number.isFinite(storedOriginal) && storedOriginal > 0) return storedOriginal;

    const paidLineTotal = Number(item.price_at_purchase || 0);
    const quantity = Number(item.quantity || 0);
    if (!Number.isFinite(quantity) || quantity <= 0) return paidLineTotal;

    const discountPrice = Number(item.discount_price);
    const currentUnitPrice = Number.isFinite(discountPrice) && discountPrice >= 0
        ? discountPrice
        : Number(item.price_per_unit ?? item.price ?? 0);
    const basePrice = Number(item.price_per_unit ?? item.price ?? currentUnitPrice);

    if (!Number.isFinite(basePrice) || basePrice <= currentUnitPrice) return paidLineTotal;

    return calculateLineTotal(quantity, buildUnitConfig({
        unit: item.unit,
        price_per_unit: basePrice,
        min_qty: Number(item.min_qty) || 1,
        step_qty: Number(item.min_qty) || 1,
    }));
};

/**
 * Update Order Status
 * PATCH /api/admin/orders/:id/status
 *
 * Updates order status and logs change in history
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const userId = (req as any).user?.id;

        const validStatuses = ['pending', 'placed', 'paid', 'accepted', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: 'Invalid status',
                validStatuses,
            });
        }

        const orderResult = await pool.query(
            'SELECT id, status FROM orders WHERE id = $1',
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const currentOrder = orderResult.rows[0];

        if (currentOrder.status === 'cancelled' && status !== 'cancelled') {
            const latestCancellationResult = await pool.query(
                `SELECT notes
                 FROM order_status_history
                 WHERE order_id = $1 AND new_status = 'cancelled'
                 ORDER BY changed_at DESC
                 LIMIT 1`,
                [id]
            );

            const latestCancellationNote = String(latestCancellationResult.rows[0]?.notes || '').toLowerCase();
            if (latestCancellationNote === 'cancelled by customer') {
                return res.status(400).json({
                    message: 'A customer-cancelled order cannot be reopened by admin',
                });
            }
        }

        const updateResult = await pool.query(
            `UPDATE orders
             SET status = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [status, id]
        );

        const updatedOrder = updateResult.rows[0];

        if (currentOrder.status !== status) {
            await pool.query(
                `INSERT INTO order_status_history
                 (order_id, old_status, new_status, notes, changed_by)
                 VALUES ($1, $2, $3, $4, $5)`,
                [id, currentOrder.status, status, notes || null, userId]
            );
        }

        if (currentOrder.status !== status) {
            const loyaltyOrderRes = await pool.query(
                `SELECT user_id, total_amount, points_earned, points_used FROM orders WHERE id = $1`,
                [id]
            );
            const loyaltyOrder = loyaltyOrderRes.rows[0];

            if (status === 'delivered' && currentOrder.status !== 'delivered') {
                const existingEarned = Number(loyaltyOrder.points_earned || 0);
                if (existingEarned <= 0) {
                    const earnedPoints = Math.floor(Number(loyaltyOrder.total_amount) / 20);
                    if (earnedPoints > 0) {
                        await pool.query(
                            `INSERT INTO loyalty_transactions (user_id, order_id, type, points, description)
                             VALUES ($1, $2, 'earned', $3, $4)`,
                            [loyaltyOrder.user_id, id, earnedPoints, `Points earned from Order #${id}`]
                        );

                        await pool.query(
                            `UPDATE users
                             SET loyalty_points = loyalty_points + $1,
                                 total_points_earned = total_points_earned + $1
                             WHERE id = $2`,
                            [earnedPoints, loyaltyOrder.user_id]
                        );

                        await pool.query(
                            `UPDATE orders SET points_earned = $1 WHERE id = $2`,
                            [earnedPoints, id]
                        );
                    }
                }
            }

            if (status === 'cancelled') {
                if (loyaltyOrder.points_used > 0) {
                    await pool.query(
                        `INSERT INTO loyalty_transactions (user_id, order_id, type, points, description)
                         VALUES ($1, $2, 'earned', $3, $4)`,
                        [loyaltyOrder.user_id, id, loyaltyOrder.points_used, `Points refunded - Order #${id} cancelled`]
                    );
                    await pool.query(
                        `UPDATE users
                         SET loyalty_points = loyalty_points + $1,
                             total_points_redeemed = GREATEST(0, total_points_redeemed - $1)
                         WHERE id = $2`,
                        [loyaltyOrder.points_used, loyaltyOrder.user_id]
                    );
                }
            }

            const customerUserId = Number(loyaltyOrder.user_id);
            if (customerUserId) {
                const statusLabels: Record<string, string> = {
                    accepted: 'accepted',
                    processing: 'being prepared',
                    shipped: 'shipped',
                    delivered: 'delivered',
                    cancelled: 'cancelled',
                    paid: 'confirmed',
                    placed: 'placed',
                    pending: 'pending',
                };

                const normalizedStatus = String(status).toLowerCase();
                await safelyRunNotificationTask(async () => {
                    await createUserNotification(pool, customerUserId, {
                        type: 'order_status_updated',
                        title: 'Order status updated',
                        message: `Order #${id} is now ${statusLabels[normalizedStatus] || normalizedStatus}.`,
                        link: `/orders/${id}`,
                        metadata: {
                            orderId: Number(id),
                            oldStatus: currentOrder.status,
                            newStatus: status,
                        },
                    });
                });
            }
        }

        res.json({
            success: true,
            order: updatedOrder,
            message: `Order status updated to ${status}`,
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getOrderStatusHistory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT
                osh.*,
                u.full_name as changed_by_name
             FROM order_status_history osh
             LEFT JOIN users u ON osh.changed_by = u.id
             WHERE osh.order_id = $1
             ORDER BY osh.changed_at DESC`,
            [id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching order history:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getOrdersByStatus = async (req: Request, res: Response) => {
    try {
        const { status, customerId } = req.query;

        let query = `
            SELECT
                o.id,
                o.user_id,
                o.total_amount,
                o.status,
                o.payment_method,
                o.created_at,
                o.updated_at,
                u.full_name as customer_name,
                u.email as customer_email,
                COUNT(oi.id) as items_count
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE 1=1
        `;

        const params: any[] = [];
        let paramIndex = 1;

        if (status && status !== 'all') {
            query += ` AND o.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (customerId) {
            query += ` AND o.user_id = $${paramIndex}`;
            params.push(customerId);
            paramIndex++;
        }

        query += ' GROUP BY o.id, u.full_name, u.email ORDER BY o.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows.map(row => ({
            ...row,
            total_amount: parseFloat(row.total_amount) || 0,
            items_count: parseInt(row.items_count) || 0,
        })));
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getOrderById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const baseUrl = getPublicBaseUrl(req);

        const orderResult = await pool.query(
            `SELECT
                o.*,
                u.full_name as customer_name,
                u.email as customer_email,
                u.phone as customer_phone
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             WHERE o.id = $1`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orderResult.rows[0];

        const itemsResult = await pool.query(
            `SELECT
                oi.*,
                p.image_url,
                p.images,
                p.price,
                p.price_per_unit,
                p.discount_price,
                p.min_qty
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = $1`,
            [id]
        );

        const timelineResult = await pool.query(
            `SELECT
                osh.id,
                osh.old_status,
                osh.new_status,
                osh.notes,
                osh.changed_at,
                u.full_name as changed_by_name
             FROM order_status_history osh
             LEFT JOIN users u ON osh.changed_by = u.id
             WHERE osh.order_id = $1
             ORDER BY osh.changed_at DESC`,
            [id]
        );

        const placedEvent = {
            id: 0,
            old_status: null,
            new_status: 'placed',
            notes: 'Order was placed by customer',
            changed_at: order.created_at,
            changed_by_name: order.customer_name || 'Customer',
        };

        const items = itemsResult.rows.map(item => ({
            ...item,
            image_url: normalizeMediaUrl(
                Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : item.image_url,
                baseUrl
            ),
            quantity: Number(item.quantity),
            price: parseFloat(item.price_at_purchase) || 0,
            price_at_purchase: parseFloat(item.price_at_purchase) || 0,
            original_price_at_purchase: resolveOriginalLineTotal(item),
        }));
        const subtotal = items.reduce((sum, item) => sum + Number(item.price_at_purchase || 0), 0);
        const pointsUsed = Number(order.points_used || 0);
        const couponDiscount = Number(order.discount_amount || 0);
        const totalDiscount = pointsUsed + couponDiscount;
        const totalAmount = parseFloat(order.total_amount) || 0;
        const deliveryFee = Math.max(0, totalAmount - subtotal + totalDiscount);
        const timeline = [...timelineResult.rows, placedEvent];

        res.json({
            ...order,
            total_amount: totalAmount,
            subtotal,
            delivery_fee: deliveryFee,
            points_used: pointsUsed,
            coupon_discount: couponDiscount,
            discount_amount: totalDiscount,
            items,
            timeline,
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'Server error fetching order details' });
    }
};
