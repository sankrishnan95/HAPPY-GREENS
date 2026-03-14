import { pool } from '../db';

interface AnalyticsEventPayload {
    eventType: string;
    userId: number | null;
    productId: number | null;
    page: string | null;
}

const ACTIVE_ORDER_FILTER = "o.status <> 'cancelled'";

const toNumber = (value: unknown): number => Number(value || 0);

export const recordAnalyticsEvent = async ({ eventType, userId, productId, page }: AnalyticsEventPayload): Promise<void> => {
    await pool.query(
        `INSERT INTO analytics_events (event_type, user_id, product_id, page)
         VALUES ($1, $2, $3, $4)`,
        [eventType, userId, productId, page]
    );
};

export const getSalesAnalyticsData = async () => {
    const [summaryResult, dailyResult, categoryResult] = await Promise.all([
        pool.query(
            `WITH base AS (
                SELECT total_amount, created_at
                FROM orders
                WHERE status <> 'cancelled'
            ), monthly AS (
                SELECT
                    COALESCE(SUM(total_amount) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)), 0) AS current_month_revenue,
                    COALESCE(SUM(total_amount) FILTER (
                        WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
                          AND created_at < date_trunc('month', CURRENT_DATE)
                    ), 0) AS previous_month_revenue
                FROM base
            )
            SELECT
                COALESCE(SUM(total_amount), 0) AS total_revenue,
                COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS orders_today,
                COUNT(*) FILTER (WHERE created_at >= date_trunc('week', CURRENT_DATE)) AS orders_this_week,
                COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) AS orders_this_month,
                COALESCE(AVG(total_amount), 0) AS average_order_value,
                monthly.current_month_revenue,
                monthly.previous_month_revenue
            FROM base, monthly
            GROUP BY monthly.current_month_revenue, monthly.previous_month_revenue`
        ),
        pool.query(
            `SELECT
                TO_CHAR(DATE(created_at), 'Mon DD') AS label,
                DATE(created_at) AS sort_date,
                COUNT(*) AS orders,
                COALESCE(SUM(total_amount), 0) AS revenue
             FROM orders
             WHERE status <> 'cancelled'
               AND created_at >= CURRENT_DATE - INTERVAL '29 days'
             GROUP BY DATE(created_at)
             ORDER BY sort_date ASC`
        ),
        pool.query(
            `SELECT
                COALESCE(c.name, 'Uncategorized') AS category,
                COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS revenue
             FROM order_items oi
             JOIN orders o ON o.id = oi.order_id
             LEFT JOIN products p ON p.id = oi.product_id
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE ${ACTIVE_ORDER_FILTER}
             GROUP BY COALESCE(c.name, 'Uncategorized')
             ORDER BY revenue DESC
             LIMIT 8`
        )
    ]);

    const summary = summaryResult.rows[0] || {};
    const currentMonthRevenue = toNumber(summary.current_month_revenue);
    const previousMonthRevenue = toNumber(summary.previous_month_revenue);
    const revenueGrowth = previousMonthRevenue > 0
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : (currentMonthRevenue > 0 ? 100 : 0);

    return {
        metrics: {
            totalRevenue: toNumber(summary.total_revenue),
            ordersToday: toNumber(summary.orders_today),
            ordersThisWeek: toNumber(summary.orders_this_week),
            ordersThisMonth: toNumber(summary.orders_this_month),
            averageOrderValue: toNumber(summary.average_order_value),
            revenueGrowth,
        },
        revenueByDay: dailyResult.rows.map((row) => ({
            label: row.label,
            revenue: toNumber(row.revenue),
            orders: toNumber(row.orders),
        })),
        revenueByCategory: categoryResult.rows.map((row) => ({
            category: row.category,
            revenue: toNumber(row.revenue),
        })),
    };
};

export const getProductAnalyticsData = async () => {
    const [tableResult, topResult, lowResult] = await Promise.all([
        pool.query(
            `SELECT
                p.id,
                p.name,
                COUNT(DISTINCT o.id) FILTER (WHERE ${ACTIVE_ORDER_FILTER}) AS orders,
                COALESCE(SUM(oi.quantity * oi.price_at_purchase) FILTER (WHERE ${ACTIVE_ORDER_FILTER}), 0) AS revenue,
                COALESCE(p.stock_quantity, 0) AS stock,
                CASE
                    WHEN COALESCE(p.stock_quantity, 0) = 0 THEN 'Out of stock'
                    WHEN COALESCE(p.stock_quantity, 0) < 10 THEN 'Low stock'
                    ELSE 'Healthy'
                END AS status,
                COALESCE(SUM(oi.quantity) FILTER (WHERE ${ACTIVE_ORDER_FILTER}), 0) AS units_sold
             FROM products p
             LEFT JOIN order_items oi ON oi.product_id = p.id
             LEFT JOIN orders o ON o.id = oi.order_id
             WHERE COALESCE(p.is_deleted, false) = false
             GROUP BY p.id, p.name, p.stock_quantity
             ORDER BY revenue DESC, orders DESC, p.name ASC`
        ),
        pool.query(
            `SELECT
                p.id,
                p.name,
                COALESCE(SUM(oi.quantity), 0) AS units_sold,
                COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS revenue
             FROM products p
             LEFT JOIN order_items oi ON oi.product_id = p.id
             LEFT JOIN orders o ON o.id = oi.order_id AND ${ACTIVE_ORDER_FILTER}
             WHERE COALESCE(p.is_deleted, false) = false
             GROUP BY p.id, p.name
             ORDER BY units_sold DESC, revenue DESC
             LIMIT 5`
        ),
        pool.query(
            `SELECT
                p.id,
                p.name,
                COALESCE(SUM(oi.quantity), 0) AS units_sold,
                COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) AS revenue
             FROM products p
             LEFT JOIN order_items oi ON oi.product_id = p.id
             LEFT JOIN orders o ON o.id = oi.order_id AND ${ACTIVE_ORDER_FILTER}
             WHERE COALESCE(p.is_deleted, false) = false
             GROUP BY p.id, p.name
             ORDER BY units_sold ASC, revenue ASC, p.name ASC
             LIMIT 5`
        )
    ]);

    const products = tableResult.rows.map((row) => ({
        productId: toNumber(row.id),
        name: row.name,
        orders: toNumber(row.orders),
        revenue: toNumber(row.revenue),
        stock: toNumber(row.stock),
        status: row.status,
        unitsSold: toNumber(row.units_sold),
    }));

    return {
        metrics: {
            topSellingProducts: products.slice(0, 5),
            lowPerformingProducts: lowResult.rows.map((row) => ({
                productId: toNumber(row.id),
                name: row.name,
                unitsSold: toNumber(row.units_sold),
                revenue: toNumber(row.revenue),
            })),
            revenuePerProduct: products.slice(0, 8).map((row) => ({
                name: row.name,
                revenue: row.revenue,
            })),
            inventoryLevels: {
                lowStockCount: products.filter((row) => row.stock < 10).length,
                outOfStockCount: products.filter((row) => row.stock === 0).length,
                activeProducts: products.length,
            },
        },
        topSelling: topResult.rows.map((row) => ({
            productId: toNumber(row.id),
            name: row.name,
            unitsSold: toNumber(row.units_sold),
            revenue: toNumber(row.revenue),
        })),
        table: products,
    };
};

export const getCustomerAnalyticsData = async () => {
    const [summaryResult, newUsersByWeekResult] = await Promise.all([
        pool.query(
            `WITH customer_orders AS (
                SELECT
                    u.id,
                    u.created_at,
                    COUNT(o.id) FILTER (WHERE o.status <> 'cancelled') AS order_count,
                    COALESCE(SUM(o.total_amount) FILTER (WHERE o.status <> 'cancelled'), 0) AS total_spent
                FROM users u
                LEFT JOIN orders o ON o.user_id = u.id
                WHERE u.role = 'customer'
                GROUP BY u.id, u.created_at
            )
            SELECT
                COUNT(*) AS total_customers,
                COUNT(*) FILTER (WHERE order_count <= 1) AS new_customers,
                COUNT(*) FILTER (WHERE order_count > 1) AS returning_customers,
                COALESCE(AVG(total_spent), 0) AS average_spend_per_customer,
                COALESCE(
                    100.0 * COUNT(*) FILTER (WHERE order_count > 1) / NULLIF(COUNT(*) FILTER (WHERE order_count > 0), 0),
                    0
                ) AS repeat_purchase_rate
            FROM customer_orders`
        ),
        pool.query(
            `SELECT
                TO_CHAR(date_trunc('week', created_at), 'Mon DD') AS label,
                date_trunc('week', created_at) AS sort_week,
                COUNT(*) AS new_users
             FROM users
             WHERE role = 'customer'
               AND created_at >= CURRENT_DATE - INTERVAL '11 weeks'
             GROUP BY sort_week
             ORDER BY sort_week ASC`
        )
    ]);

    const summary = summaryResult.rows[0] || {};

    return {
        metrics: {
            totalCustomers: toNumber(summary.total_customers),
            newCustomers: toNumber(summary.new_customers),
            returningCustomers: toNumber(summary.returning_customers),
            averageSpendPerCustomer: toNumber(summary.average_spend_per_customer),
            repeatPurchaseRate: toNumber(summary.repeat_purchase_rate),
        },
        newUsersByWeek: newUsersByWeekResult.rows.map((row) => ({
            label: row.label,
            newUsers: toNumber(row.new_users),
        })),
        customerMix: [
            { name: 'New', value: toNumber(summary.new_customers) },
            { name: 'Returning', value: toNumber(summary.returning_customers) },
        ],
    };
};

export const getOrderAnalyticsData = async () => {
    const [summaryResult, statusResult, dayResult, hourResult] = await Promise.all([
        pool.query(
            `SELECT
                COUNT(*) AS total_orders,
                COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders,
                COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS orders_today,
                COALESCE(AVG(total_amount), 0) AS average_order_value
             FROM orders`
        ),
        pool.query(
            `SELECT status, COUNT(*) AS count
             FROM orders
             GROUP BY status
             ORDER BY count DESC`
        ),
        pool.query(
            `SELECT
                TO_CHAR(DATE(created_at), 'Mon DD') AS label,
                DATE(created_at) AS sort_date,
                COUNT(*) AS orders
             FROM orders
             WHERE created_at >= CURRENT_DATE - INTERVAL '29 days'
             GROUP BY DATE(created_at)
             ORDER BY sort_date ASC`
        ),
        pool.query(
            `SELECT
                LPAD(EXTRACT(HOUR FROM created_at)::text, 2, '0') || ':00' AS hour,
                COUNT(*) AS orders
             FROM orders
             WHERE created_at >= CURRENT_DATE - INTERVAL '29 days'
             GROUP BY EXTRACT(HOUR FROM created_at)
             ORDER BY EXTRACT(HOUR FROM created_at) ASC`
        )
    ]);

    const hourly = hourResult.rows.map((row) => ({ hour: row.hour, orders: toNumber(row.orders) }));
    const peakOrderHours = [...hourly].sort((a, b) => b.orders - a.orders).slice(0, 5);

    return {
        metrics: {
            totalOrders: toNumber(summaryResult.rows[0]?.total_orders),
            cancelledOrders: toNumber(summaryResult.rows[0]?.cancelled_orders),
            ordersToday: toNumber(summaryResult.rows[0]?.orders_today),
            averageOrderValue: toNumber(summaryResult.rows[0]?.average_order_value),
            peakOrderHours,
        },
        ordersByStatus: statusResult.rows.map((row) => ({ status: row.status, count: toNumber(row.count) })),
        ordersByDay: dayResult.rows.map((row) => ({ label: row.label, orders: toNumber(row.orders) })),
        ordersByHour: hourly,
    };
};

export const getInventoryInsightsData = async () => {
    const [lowStockResult, fastSellingResult, slowMovingResult] = await Promise.all([
        pool.query(
            `SELECT id, name, COALESCE(stock_quantity, 0) AS stock
             FROM products
             WHERE COALESCE(is_deleted, false) = false
               AND COALESCE(stock_quantity, 0) < 10
             ORDER BY stock ASC, name ASC
             LIMIT 25`
        ),
        pool.query(
            `SELECT
                p.id,
                p.name,
                COALESCE(SUM(oi.quantity), 0) AS units_sold,
                COALESCE(p.stock_quantity, 0) AS stock
             FROM products p
             LEFT JOIN order_items oi ON oi.product_id = p.id
             LEFT JOIN orders o ON o.id = oi.order_id AND ${ACTIVE_ORDER_FILTER}
             WHERE COALESCE(p.is_deleted, false) = false
             GROUP BY p.id, p.name, p.stock_quantity
             ORDER BY units_sold DESC, p.name ASC
             LIMIT 10`
        ),
        pool.query(
            `SELECT
                p.id,
                p.name,
                COALESCE(SUM(oi.quantity), 0) AS units_sold,
                COALESCE(p.stock_quantity, 0) AS stock
             FROM products p
             LEFT JOIN order_items oi ON oi.product_id = p.id
             LEFT JOIN orders o ON o.id = oi.order_id AND ${ACTIVE_ORDER_FILTER}
             WHERE COALESCE(p.is_deleted, false) = false
             GROUP BY p.id, p.name, p.stock_quantity
             ORDER BY units_sold ASC, p.name ASC
             LIMIT 10`
        )
    ]);

    return {
        metrics: {
            lowStockCount: lowStockResult.rows.length,
            fastSellingCount: fastSellingResult.rows.filter((row) => toNumber(row.units_sold) > 0).length,
            slowMovingCount: slowMovingResult.rows.length,
        },
        lowStockItems: lowStockResult.rows.map((row) => ({
            productId: toNumber(row.id),
            name: row.name,
            stock: toNumber(row.stock),
        })),
        fastSellingProducts: fastSellingResult.rows.map((row) => ({
            productId: toNumber(row.id),
            name: row.name,
            unitsSold: toNumber(row.units_sold),
            stock: toNumber(row.stock),
        })),
        slowMovingProducts: slowMovingResult.rows.map((row) => ({
            productId: toNumber(row.id),
            name: row.name,
            unitsSold: toNumber(row.units_sold),
            stock: toNumber(row.stock),
        })),
    };
};

export const getTrafficAnalyticsData = async () => {
    const [summaryResult, visitsByDayResult, topPagesResult, ordersResult] = await Promise.all([
        pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE event_type = 'page_view') AS total_visits,
                COUNT(*) FILTER (WHERE event_type = 'product_view') AS product_views,
                COUNT(*) FILTER (WHERE event_type = 'add_to_cart') AS add_to_cart,
                COUNT(*) FILTER (WHERE event_type = 'checkout_start') AS checkout_starts
             FROM analytics_events
             WHERE created_at >= CURRENT_DATE - INTERVAL '29 days'`
        ),
        pool.query(
            `SELECT
                TO_CHAR(DATE(created_at), 'Mon DD') AS label,
                DATE(created_at) AS sort_date,
                COUNT(*) FILTER (WHERE event_type = 'page_view') AS visits,
                COUNT(*) FILTER (WHERE event_type = 'product_view') AS product_views
             FROM analytics_events
             WHERE created_at >= CURRENT_DATE - INTERVAL '29 days'
             GROUP BY DATE(created_at)
             ORDER BY sort_date ASC`
        ),
        pool.query(
            `SELECT COALESCE(page, 'Unknown') AS page, COUNT(*) AS visits
             FROM analytics_events
             WHERE event_type = 'page_view'
               AND created_at >= CURRENT_DATE - INTERVAL '29 days'
             GROUP BY COALESCE(page, 'Unknown')
             ORDER BY visits DESC
             LIMIT 10`
        ),
        pool.query(
            `SELECT COUNT(*) AS orders
             FROM orders
             WHERE status <> 'cancelled'
               AND created_at >= CURRENT_DATE - INTERVAL '29 days'`
        )
    ]);

    const summary = summaryResult.rows[0] || {};
    const orders = toNumber(ordersResult.rows[0]?.orders);
    const totalVisits = toNumber(summary.total_visits);
    const addToCart = toNumber(summary.add_to_cart);
    const checkoutStarts = toNumber(summary.checkout_starts);

    return {
        metrics: {
            totalVisits,
            productViews: toNumber(summary.product_views),
            addToCart,
            checkoutStarts,
            checkoutConversionRate: totalVisits > 0 ? (orders / totalVisits) * 100 : 0,
            addToCartRate: totalVisits > 0 ? (addToCart / totalVisits) * 100 : 0,
        },
        visitsByDay: visitsByDayResult.rows.map((row) => ({
            label: row.label,
            visits: toNumber(row.visits),
            productViews: toNumber(row.product_views),
        })),
        funnel: [
            { name: 'Visits', value: totalVisits },
            { name: 'Product Views', value: toNumber(summary.product_views) },
            { name: 'Add To Cart', value: addToCart },
            { name: 'Orders', value: orders },
        ],
        topPages: topPagesResult.rows.map((row) => ({ page: row.page, visits: toNumber(row.visits) })),
    };
};
