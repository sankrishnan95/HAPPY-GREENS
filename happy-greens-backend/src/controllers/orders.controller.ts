import { Request, Response } from 'express';
import { pool } from '../db';
import { getPublicBaseUrl, normalizeMediaUrl } from '../utils/media';

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
        const userId = (req as any).user?.id; // Admin user ID from auth middleware

        // Validate status
        const validStatuses = ['pending', 'placed', 'paid', 'accepted', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: 'Invalid status',
                validStatuses
            });
        }

        // Get current order
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
                    message: 'A customer-cancelled order cannot be reopened by admin'
                });
            }
        }

        // Update order status
        const updateResult = await pool.query(
            `UPDATE orders 
             SET status = $1, updated_at = NOW() 
             WHERE id = $2 
             RETURNING *`,
            [status, id]
        );

        const updatedOrder = updateResult.rows[0];

        // Log status change in history (with notes and admin user)
        if (currentOrder.status !== status) {
            await pool.query(
                `INSERT INTO order_status_history 
                 (order_id, old_status, new_status, notes, changed_by) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [id, currentOrder.status, status, notes || null, userId]
            );
        }

        // â”€â”€ Loyalty Points Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        if (currentOrder.status !== status) {
            // Fetch full order details for loyalty calculation
            const loyaltyOrderRes = await pool.query(
                `SELECT user_id, total_amount, points_earned, points_used FROM orders WHERE id = $1`,
                [id]
            );
            const loyaltyOrder = loyaltyOrderRes.rows[0];

            if (status === 'delivered' && currentOrder.status !== 'delivered') {
                const existingEarned = Number(loyaltyOrder.points_earned || 0);
                if (existingEarned <= 0) {
                    // Award points: 1 point per INR 20 spent
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
                // Reverse previously earned points (if order was already delivered)
                if (loyaltyOrder.points_earned > 0) {
                    await pool.query(
                        `INSERT INTO loyalty_transactions (user_id, order_id, type, points, description)
                         VALUES ($1, $2, 'reversed', $3, $4)`,
                        [loyaltyOrder.user_id, id, -loyaltyOrder.points_earned, `Points reversed â€” Order #${id} cancelled`]
                    );
                    await pool.query(
                        `UPDATE users
                         SET loyalty_points = GREATEST(0, loyalty_points - $1),
                             total_points_earned = GREATEST(0, total_points_earned - $1)
                         WHERE id = $2`,
                        [loyaltyOrder.points_earned, loyaltyOrder.user_id]
                    );
                    await pool.query(`UPDATE orders SET points_earned = 0 WHERE id = $1`, [id]);
                }
                // Refund redeemed points (if customer used points on this order)
                if (loyaltyOrder.points_used > 0) {
                    await pool.query(
                        `INSERT INTO loyalty_transactions (user_id, order_id, type, points, description)
                         VALUES ($1, $2, 'earned', $3, $4)`,
                        [loyaltyOrder.user_id, id, loyaltyOrder.points_used, `Points refunded â€” Order #${id} cancelled`]
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
        }
        // â”€â”€ End Loyalty Points Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        res.json({
            success: true,
            order: updatedOrder,
            message: `Order status updated to ${status}`
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get Order Status History
 * GET /api/admin/orders/:id/history
 * 
 * Returns status change history for an order
 */
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

/**
 * Get Orders by Status
 * GET /api/admin/orders?status=pending
 * 
 * Returns filtered orders list
 */
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
            items_count: parseInt(row.items_count) || 0
        })));
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get Order By ID
 * GET /api/admin/orders/:id
 * 
 * Returns full detailed order including customer and order items.
 */
export const getOrderById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const baseUrl = getPublicBaseUrl(req);

        // 1. Fetch Order & Customer Details
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

        // 2. Fetch Order Items
        const itemsResult = await pool.query(
            `SELECT 
                oi.*,
                p.image_url,
                p.images
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = $1`,
            [id]
        );

        // 3. Fetch Order Timeline (from existing order_status_history)
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

        // Also inject a synthetic "Order Placed" event from order creation
        const placedEvent = {
            id: 0,
            old_status: null,
            new_status: 'placed',
            notes: 'Order was placed by customer',
            changed_at: order.created_at,
            changed_by_name: order.customer_name || 'Customer'
        };

        const timeline = [...timelineResult.rows, placedEvent];

        res.json({
            ...order,
            total_amount: parseFloat(order.total_amount) || 0,
            items: itemsResult.rows.map(item => ({
                ...item,
                image_url: normalizeMediaUrl(
                    Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : item.image_url,
                    baseUrl
                ),
                quantity: Number(item.quantity),
                price: parseFloat(item.price_at_purchase) || 0,
                price_at_purchase: parseFloat(item.price_at_purchase) || 0
            })),
            timeline
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ message: 'Server error fetching order details' });
    }
};



