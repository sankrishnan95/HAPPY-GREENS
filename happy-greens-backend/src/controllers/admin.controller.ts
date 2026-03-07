import { Request, Response } from 'express';
import { pool } from '../db';

/**
 * Revenue Analytics
 * GET /api/admin/analytics/revenue
 * 
 * Returns:
 * - Total revenue from successful payments
 * - Revenue by day (last 30 days)
 * - Revenue by month (last 12 months)
 * - Average order value
 */
export const getRevenueAnalytics = async (req: Request, res: Response) => {
    try {
        // Total revenue from successful payments
        const totalRevenueResult = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total_revenue, COUNT(*) as total_payments
             FROM payments 
             WHERE payment_status = 'succeeded'`
        );

        // Average order value
        const avgOrderResult = await pool.query(
            `SELECT COALESCE(AVG(total_amount), 0) as avg_order_value
             FROM orders 
             WHERE status = 'paid'`
        );

        // Revenue by day (last 30 days)
        const revenueByDayResult = await pool.query(
            `SELECT 
                DATE(created_at) as date,
                COALESCE(SUM(amount), 0) as revenue,
                COUNT(*) as payment_count
             FROM payments
             WHERE payment_status = 'succeeded' 
                AND created_at >= CURRENT_DATE - INTERVAL '30 days'
             GROUP BY DATE(created_at)
             ORDER BY date DESC`
        );

        // Revenue by month (last 12 months)
        const revenueByMonthResult = await pool.query(
            `SELECT 
                TO_CHAR(created_at, 'YYYY-MM') as month,
                COALESCE(SUM(amount), 0) as revenue,
                COUNT(*) as payment_count
             FROM payments
             WHERE payment_status = 'succeeded'
                AND created_at >= CURRENT_DATE - INTERVAL '12 months'
             GROUP BY TO_CHAR(created_at, 'YYYY-MM')
             ORDER BY month DESC`
        );

        res.json({
            total_revenue: parseFloat(totalRevenueResult.rows[0].total_revenue),
            total_payments: parseInt(totalRevenueResult.rows[0].total_payments),
            avg_order_value: parseFloat(avgOrderResult.rows[0].avg_order_value),
            revenue_by_day: revenueByDayResult.rows.map(row => ({
                date: row.date,
                revenue: parseFloat(row.revenue),
                payment_count: parseInt(row.payment_count)
            })),
            revenue_by_month: revenueByMonthResult.rows.map(row => ({
                month: row.month,
                revenue: parseFloat(row.revenue),
                payment_count: parseInt(row.payment_count)
            }))
        });
    } catch (error) {
        console.error('Revenue analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Orders Analytics
 * GET /api/admin/analytics/orders
 * 
 * Returns:
 * - Total orders
 * - Orders by status
 * - Orders by day (last 30 days)
 * - Orders by month (last 12 months)
 */
export const getOrdersAnalytics = async (req: Request, res: Response) => {
    try {
        // Total orders
        const totalOrdersResult = await pool.query(
            `SELECT COUNT(*) as total_orders FROM orders`
        );

        // Orders by status
        const ordersByStatusResult = await pool.query(
            `SELECT 
                status,
                COUNT(*) as count,
                COALESCE(SUM(total_amount), 0) as total_value
             FROM orders
             GROUP BY status
             ORDER BY count DESC`
        );

        // Orders by day (last 30 days)
        const ordersByDayResult = await pool.query(
            `SELECT 
                DATE(created_at) as date,
                COUNT(*) as order_count,
                COALESCE(SUM(total_amount), 0) as total_value
             FROM orders
             WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
             GROUP BY DATE(created_at)
             ORDER BY date DESC`
        );

        // Orders by month (last 12 months)
        const ordersByMonthResult = await pool.query(
            `SELECT 
                TO_CHAR(created_at, 'YYYY-MM') as month,
                COUNT(*) as order_count,
                COALESCE(SUM(total_amount), 0) as total_value
             FROM orders
             WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
             GROUP BY TO_CHAR(created_at, 'YYYY-MM')
             ORDER BY month DESC`
        );

        res.json({
            total_orders: parseInt(totalOrdersResult.rows[0].total_orders),
            orders_by_status: ordersByStatusResult.rows.map(row => ({
                status: row.status,
                count: parseInt(row.count),
                total_value: parseFloat(row.total_value)
            })),
            orders_by_day: ordersByDayResult.rows.map(row => ({
                date: row.date,
                order_count: parseInt(row.order_count),
                total_value: parseFloat(row.total_value)
            })),
            orders_by_month: ordersByMonthResult.rows.map(row => ({
                month: row.month,
                order_count: parseInt(row.order_count),
                total_value: parseFloat(row.total_value)
            }))
        });
    } catch (error) {
        console.error('Orders analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Customer Analytics
 * GET /api/admin/analytics/customers
 * 
 * Returns:
 * - Total customers
 * - New customers by period
 * - Customer lifetime value
 * - Top customers by total spend
 */
export const getCustomerAnalytics = async (req: Request, res: Response) => {
    try {
        // Total customers
        const totalCustomersResult = await pool.query(
            `SELECT COUNT(*) as total_customers FROM users WHERE role = 'customer'`
        );

        // New customers by month (last 12 months)
        const newCustomersByMonthResult = await pool.query(
            `SELECT 
                TO_CHAR(created_at, 'YYYY-MM') as month,
                COUNT(*) as new_customers
             FROM users
             WHERE role = 'customer' 
                AND created_at >= CURRENT_DATE - INTERVAL '12 months'
             GROUP BY TO_CHAR(created_at, 'YYYY-MM')
             ORDER BY month DESC`
        );

        // Customer lifetime value (top 10)
        const customerLTVResult = await pool.query(
            `SELECT 
                u.id,
                u.email,
                u.full_name,
                COUNT(o.id) as total_orders,
                COALESCE(SUM(o.total_amount), 0) as lifetime_value
             FROM users u
             LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'paid'
             WHERE u.role = 'customer'
             GROUP BY u.id, u.email, u.full_name
             HAVING COUNT(o.id) > 0
             ORDER BY lifetime_value DESC
             LIMIT 10`
        );

        // Top customers by total spend (top 20)
        const topCustomersResult = await pool.query(
            `SELECT 
                u.id,
                u.email,
                u.full_name,
                COUNT(o.id) as total_orders,
                COALESCE(SUM(o.total_amount), 0) as total_spent,
                MAX(o.created_at) as last_order_date
             FROM users u
             INNER JOIN orders o ON u.id = o.user_id
             WHERE u.role = 'customer' AND o.status = 'paid'
             GROUP BY u.id, u.email, u.full_name
             ORDER BY total_spent DESC
             LIMIT 20`
        );

        res.json({
            total_customers: parseInt(totalCustomersResult.rows[0].total_customers),
            new_customers_by_month: newCustomersByMonthResult.rows.map(row => ({
                month: row.month,
                new_customers: parseInt(row.new_customers)
            })),
            customer_lifetime_value: customerLTVResult.rows.map(row => ({
                customer_id: row.id,
                email: row.email,
                full_name: row.full_name,
                total_orders: parseInt(row.total_orders),
                lifetime_value: parseFloat(row.lifetime_value)
            })),
            top_customers: topCustomersResult.rows.map(row => ({
                customer_id: row.id,
                email: row.email,
                full_name: row.full_name,
                total_orders: parseInt(row.total_orders),
                total_spent: parseFloat(row.total_spent),
                last_order_date: row.last_order_date
            }))
        });
    } catch (error) {
        console.error('Customer analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Product Analytics
 * GET /api/admin/analytics/products
 * 
 * Returns:
 * - Top selling products by quantity
 * - Top selling products by revenue
 * - Low stock products
 * - Category performance
 */
export const getProductAnalytics = async (req: Request, res: Response) => {
    try {
        // Top selling products by quantity (top 20)
        const topByQuantityResult = await pool.query(
            `SELECT 
                p.id,
                p.name,
                p.price,
                p.stock_quantity,
                c.name as category_name,
                COALESCE(SUM(oi.quantity), 0) as total_sold
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN order_items oi ON p.id = oi.product_id
             LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'paid'
             WHERE p.is_deleted = false
             GROUP BY p.id, p.name, p.price, p.stock_quantity, c.name
             ORDER BY total_sold DESC
             LIMIT 20`
        );

        // Top selling products by revenue (top 20)
        const topByRevenueResult = await pool.query(
            `SELECT 
                p.id,
                p.name,
                p.price,
                c.name as category_name,
                COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) as total_revenue,
                COALESCE(SUM(oi.quantity), 0) as total_sold
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN order_items oi ON p.id = oi.product_id
             LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'paid'
             WHERE p.is_deleted = false
             GROUP BY p.id, p.name, p.price, c.name
             ORDER BY total_revenue DESC
             LIMIT 20`
        );

        // Low stock products (stock < 10)
        const lowStockResult = await pool.query(
            `SELECT 
                p.id,
                p.name,
                p.price,
                p.stock_quantity,
                c.name as category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.is_deleted = false AND p.stock_quantity < 10
             ORDER BY p.stock_quantity ASC
             LIMIT 50`
        );

        // Category performance
        const categoryPerformanceResult = await pool.query(
            `SELECT 
                c.id,
                c.name as category_name,
                COUNT(DISTINCT p.id) as product_count,
                COALESCE(SUM(oi.quantity), 0) as total_items_sold,
                COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) as total_revenue
             FROM categories c
             LEFT JOIN products p ON c.id = p.category_id AND p.is_deleted = false
             LEFT JOIN order_items oi ON p.id = oi.product_id
             LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'paid'
             GROUP BY c.id, c.name
             ORDER BY total_revenue DESC`
        );

        res.json({
            top_products_by_quantity: topByQuantityResult.rows.map(row => ({
                product_id: row.id,
                name: row.name,
                price: parseFloat(row.price),
                stock_quantity: row.stock_quantity,
                category: row.category_name,
                total_sold: parseInt(row.total_sold)
            })),
            top_products_by_revenue: topByRevenueResult.rows.map(row => ({
                product_id: row.id,
                name: row.name,
                price: parseFloat(row.price),
                category: row.category_name,
                total_revenue: parseFloat(row.total_revenue),
                total_sold: parseInt(row.total_sold)
            })),
            low_stock_products: lowStockResult.rows.map(row => ({
                product_id: row.id,
                name: row.name,
                price: parseFloat(row.price),
                stock_quantity: row.stock_quantity,
                category: row.category_name
            })),
            category_performance: categoryPerformanceResult.rows.map(row => ({
                category_id: row.id,
                category_name: row.category_name,
                product_count: parseInt(row.product_count),
                total_items_sold: parseInt(row.total_items_sold),
                total_revenue: parseFloat(row.total_revenue)
            }))
        });
    } catch (error) {
        console.error('Product analytics error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get All Customers
 * GET /api/admin/customers
 * 
 * Returns a list of all users with role 'customer', joining orders table 
 * to aggregate total orders and total amount spent.
 */
export const getCustomers = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id, 
                u.full_name as name, 
                u.email, 
                u.phone, 
                u.created_at,
                COUNT(DISTINCT o.id) as total_orders,
                COALESCE(SUM(o.total_amount), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
            WHERE u.role = 'customer'
            GROUP BY u.id, u.full_name, u.email, u.phone, u.created_at
            ORDER BY u.created_at DESC
        `);

        res.json(result.rows.map(row => ({
            ...row,
            total_orders: parseInt(row.total_orders) || 0,
            total_spent: parseFloat(row.total_spent) || 0
        })));
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get Customer By ID
 * GET /api/admin/customers/:id
 * 
 * Returns detailed information about a specific customer.
 */
export const getCustomerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                u.id, 
                u.full_name as name, 
                u.email, 
                u.phone, 
                u.created_at,
                u.loyalty_points,
                u.total_points_earned,
                u.total_points_redeemed,
                COUNT(DISTINCT o.id) as total_orders,
                COALESCE(SUM(o.total_amount), 0) as total_spent,
                MAX(o.created_at) as last_order_date
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id AND o.status != 'cancelled'
            WHERE u.id = $1 AND u.role = 'customer'
            GROUP BY u.id, u.full_name, u.email, u.phone, u.created_at,
                     u.loyalty_points, u.total_points_earned, u.total_points_redeemed
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Also fetch loyalty transaction history
        const loyaltyRes = await pool.query(
            `SELECT id, type, points, description, created_at, order_id
             FROM loyalty_transactions
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 20`,
            [id]
        );

        res.json({
            ...result.rows[0],
            total_orders: parseInt(result.rows[0].total_orders) || 0,
            total_spent: parseFloat(result.rows[0].total_spent) || 0,
            loyalty_history: loyaltyRes.rows
        });
    } catch (error) {
        console.error('Error fetching customer details:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Admin Dashboard Analytics
 * GET /api/admin/analytics/dashboard?timeFilter=7|30|90|all
 * 
 * Returns aggregated metrics for the new Admin Dashboard:
 * - totalOrders, totalRevenue, avgOrderValue, avgOrdersPerDay, avgSalesPerDay
 * - ordersByDate, salesByDate (for Line Charts)
 * - returningCustomerRate
 * - topRegions
 */
export const getDashboardAnalytics = async (req: Request, res: Response) => {
    try {
        const timeFilter = req.query.timeFilter as string || '7';

        // Build the date constraint based on timeFilter
        let dateConstraint = '';
        let daysToDivide = 1;

        switch (timeFilter) {
            case '7':
                dateConstraint = "AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
                daysToDivide = 7;
                break;
            case '30':
                dateConstraint = "AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
                daysToDivide = 30;
                break;
            case '90':
                dateConstraint = "AND created_at >= CURRENT_DATE - INTERVAL '90 days'";
                daysToDivide = 90;
                break;
            case 'all':
            default:
                // For 'all', we calculate days between first order and now, fallback to 1
                dateConstraint = "";
                const firstOrderRes = await pool.query('SELECT MIN(created_at) as first_date FROM orders');
                if (firstOrderRes.rows[0].first_date) {
                    const diffTime = Math.abs(new Date().getTime() - new Date(firstOrderRes.rows[0].first_date).getTime());
                    daysToDivide = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                }
                break;
        }

        // 1. Core Metrics (Total Orders & Total Revenue for paid/delivered etc)
        // Adjusting 'orders' to exclude cancelled/failed orders if necessary, but we fetch all non-cancelled.
        const metricsRes = await pool.query(`
            SELECT 
                COUNT(id) as total_orders,
                COALESCE(SUM(total_amount), 0) as total_revenue
            FROM orders
            WHERE status != 'cancelled' ${dateConstraint}
        `);

        const totalOrders = parseInt(metricsRes.rows[0].total_orders) || 0;
        const totalRevenue = parseFloat(metricsRes.rows[0].total_revenue) || 0;
        const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
        const avgOrdersPerDay = totalOrders / daysToDivide;
        const avgSalesPerDay = totalRevenue / daysToDivide;

        // 2. Charts Data (Orders and Sales by Date)
        const chartsRes = await pool.query(`
            SELECT 
                TO_CHAR(DATE(created_at), 'Mon DD') as date,
                DATE(created_at) as raw_date,
                COUNT(id) as orders,
                COALESCE(SUM(total_amount), 0) as sales
            FROM orders
            WHERE status != 'cancelled' ${dateConstraint}
            GROUP BY DATE(created_at)
            ORDER BY raw_date ASC
        `);

        const chartData = chartsRes.rows.map(row => ({
            date: row.date,
            orders: parseInt(row.orders),
            sales: parseFloat(row.sales)
        }));

        // 3. Returning Customers Rate
        // Calculate total customers who ordered vs customers with >1 order in the period
        const returningRes = await pool.query(`
            WITH CustomerOrderCounts AS (
                SELECT user_id, COUNT(id) as order_count
                FROM orders
                WHERE status != 'cancelled' ${dateConstraint} AND user_id IS NOT NULL
                GROUP BY user_id
            )
            SELECT 
                COUNT(*) as total_customers,
                COUNT(CASE WHEN order_count > 1 THEN 1 END) as returning_customers
            FROM CustomerOrderCounts
        `);

        const totalCustomers = parseInt(returningRes.rows[0]?.total_customers) || 0;
        const returningCustomers = parseInt(returningRes.rows[0]?.returning_customers) || 0;
        const returningCustomerRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

        // 4. Regional Sales
        // Grouping by billing_address->>'city'
        const regionsRes = await pool.query(`
            SELECT 
                COALESCE(billing_address->>'city', 'Unknown Region') as region,
                COUNT(id) as order_count,
                COALESCE(SUM(total_amount), 0) as total_sales
            FROM orders
            WHERE status != 'cancelled' ${dateConstraint}
            GROUP BY region
            ORDER BY total_sales DESC
            LIMIT 5
        `);

        const topRegions = regionsRes.rows.map(row => ({
            region: row.region,
            orders: parseInt(row.order_count),
            sales: parseFloat(row.total_sales)
        }));

        res.json({
            metrics: {
                totalOrders,
                totalRevenue,
                avgOrderValue,
                avgOrdersPerDay,
                avgSalesPerDay,
                returningCustomerRate,
                daysCalculated: daysToDivide
            },
            chartData,
            topRegions
        });

    } catch (error) {
        console.error('Dashboard Analytics Error:', error);
        res.status(500).json({ message: 'Server error calculating dashboard analytics' });
    }
};
