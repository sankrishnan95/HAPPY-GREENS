import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { pool } from '../db';
import {
    getRevenueAnalytics,
    getOrdersAnalytics,
    getCustomerAnalytics,
    getProductAnalytics,
    getCustomers,
    getCustomerById,
    getDashboardAnalytics
} from '../controllers/admin.controller';
import { getOrderInvoice } from '../controllers/invoice.controller';

const router = Router();

/**
 * Admin Analytics Routes
 * 
 * All routes require:
 * 1. Authentication (valid JWT token)
 * 2. Admin role (role = 'admin')
 */

/**
 * Admin Dashboard Analytics
 * GET /api/admin/analytics/dashboard
 * 
 * Returns overall dashboard metrics including total orders, revenue, 
 * average order value, sales per day, regional breakdowns, and timescale datasets.
 * 
 * Query Parameters:
 * - timeFilter: '7' | '30' | '90' | 'all' (default: '7')
 * 
 * Auth: Admin only
 */
router.get('/analytics/dashboard', authenticate, requireAdmin, getDashboardAnalytics);

/**
 * Revenue Analytics
 * GET /api/admin/analytics/revenue
 * 
 * Returns:
 * - Total revenue from successful payments
 * - Revenue by day (last 30 days)
 * - Revenue by month (last 12 months)
 * - Average order value
 * 
 * Auth: Admin only
 */
router.get('/analytics/revenue', authenticate, requireAdmin, getRevenueAnalytics);

/**
 * Orders Analytics
 * GET /api/admin/analytics/orders
 * 
 * Returns:
 * - Total orders
 * - Orders by status
 * - Orders by day (last 30 days)
 * - Orders by month (last 12 months)
 * 
 * Auth: Admin only
 */
router.get('/analytics/orders', authenticate, requireAdmin, getOrdersAnalytics);

/**
 * Customer Analytics
 * GET /api/admin/analytics/customers
 * 
 * Returns:
 * - Total customers
 * - New customers by month (last 12 months)
 * - Customer lifetime value (top 10)
 * - Top customers by total spend (top 20)
 * 
 * Auth: Admin only
 */
router.get('/analytics/customers', authenticate, requireAdmin, getCustomerAnalytics);

/**
 * Product Analytics
 * GET /api/admin/analytics/products
 * 
 * Returns:
 * - Top selling products by quantity (top 20)
 * - Top selling products by revenue (top 20)
 * - Low stock products (stock < 10)
 * - Category performance
 * 
 * Auth: Admin only
 */
router.get('/analytics/products', authenticate, requireAdmin, getProductAnalytics);

/**
 * Get All Orders
 * GET /api/admin/orders
 * 
 * Returns list of all orders with customer information
 * 
 * Auth: Admin only
 */
router.get('/orders', authenticate, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                o.id,
                o.user_id,
                o.total_amount,
                o.status,
                o.payment_method,
                o.created_at,
                u.full_name as customer_name,
                u.email as customer_email
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Get Inventory Data
 * GET /api/admin/inventory
 * 
 * Returns inventory data from bi_inventory view
 * 
 * Auth: Admin only
 */
router.get('/inventory', authenticate, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM bi_inventory ORDER BY product_id');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * Order Invoice
 * GET /api/admin/orders/:id/invoice?format=a4|thermal
 * 
 * Generates PDF invoice for an order
 * 
 * Query Parameters:
 * - format: 'a4' (default) or 'thermal' (80mm receipt)
 * 
 * Returns:
 * - PDF document with order details, items, and payment information
 * 
 * Auth: Admin only
 */
router.get('/orders/:id/invoice', authenticate, requireAdmin, getOrderInvoice);

/**
 * Get All Customers
 * GET /api/admin/customers
 * 
 * Returns a list of all users with role 'customer'
 * 
 * Auth: Admin only
 */
router.get('/customers', authenticate, requireAdmin, getCustomers);

/**
 * Get Customer By ID
 * GET /api/admin/customers/:id
 * 
 * Returns details of a specific customer
 * 
 * Auth: Admin only
 */
router.get('/customers/:id', authenticate, requireAdmin, getCustomerById);

export default router;
