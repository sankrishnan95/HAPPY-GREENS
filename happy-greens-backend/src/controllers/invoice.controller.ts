import { Request, Response } from 'express';
import { pool } from '../db';
import { OrderData, OrderItem } from '../models/order.model';
import { generateA4Invoice, generateThermalReceipt } from '../services/invoice.service';

/**
 * Get Order Invoice
 * GET /api/admin/orders/:id/invoice?format=a4|thermal
 * 
 * Generates PDF invoice from order data
 * Requires admin authentication
 */
export const getOrderInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const format = (req.query.format as string) || 'a4';

        if (!['a4', 'thermal'].includes(format)) {
            return res.status(400).json({ message: 'Invalid format. Use a4 or thermal' });
        }

        // Fetch order data with user, address, and payment information
        const orderResult = await pool.query<OrderData>(
            `SELECT 
                o.id, o.total_amount, o.status, o.payment_method, o.created_at,
                o.shipping_address,
                u.full_name, u.email, u.phone,
                p.amount as payment_amount, p.payment_gateway, p.payment_method_type,
                p.gateway_payment_id
             FROM orders o
             JOIN users u ON o.user_id = u.id
             LEFT JOIN payments p ON o.id = p.order_id AND p.payment_status = 'succeeded'
             WHERE o.id = $1`,
            [id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const orderData = orderResult.rows[0];

        // Validate order can have an invoice (printable statuses - COD orders are never 'paid')
        const printableStatuses = ['paid', 'placed', 'accepted', 'shipped', 'delivered'];
        if (!printableStatuses.includes(orderData.status)) {
            return res.status(400).json({ message: `Cannot generate invoice for orders with status: ${orderData.status}` });
        }

        // Fetch order items
        const itemsResult = await pool.query<OrderItem>(
            `SELECT 
                oi.product_name, oi.quantity, oi.unit, oi.price_at_purchase,
                oi.price_at_purchase as line_total
             FROM order_items oi
             WHERE oi.order_id = $1
             ORDER BY oi.id`,
            [id]
        );

        if (itemsResult.rows.length === 0) {
            return res.status(400).json({ message: 'Order has no items' });
        }

        const items = itemsResult.rows;

        // Generate PDF based on format using the service
        if (format === 'thermal') {
            generateThermalReceipt(res, orderData, items);
        } else {
            generateA4Invoice(res, orderData, items);
        }
    } catch (error) {
        console.error('Invoice generation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
