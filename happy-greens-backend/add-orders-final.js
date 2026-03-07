const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function addDummyOrders() {
    try {
        console.log('📦 Adding dummy orders...');

        const customerResult = await pool.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['customer']);
        const productsResult = await pool.query('SELECT id, name, price FROM products LIMIT 20');

        const customerId = customerResult.rows[0].id;
        const products = productsResult.rows;

        // Orders with valid statuses based on existing data
        const orders = [
            { total: 1250.50, status: 'delivered', payment: 'razorpay', items: 8 },
            { total: 680.00, status: 'delivered', payment: 'stripe', items: 4 },
            { total: 350.75, status: 'pending', payment: 'cod', items: 2 },
            { total: 1800.00, status: 'delivered', payment: 'razorpay', items: 9 },
            { total: 960.25, status: 'cancelled', payment: 'stripe', items: 6 },
            { total: 450.00, status: 'delivered', payment: 'stripe', items: 3 },
            { total: 2100.00, status: 'pending', payment: 'cod', items: 12 },
            { total: 550.50, status: 'delivered', payment: 'razorpay', items: 4 },
        ];

        for (const orderData of orders) {
            // Create order
            const orderResult = await pool.query(
                'INSERT INTO orders (user_id, total_amount, status, payment_method) VALUES ($1, $2, $3, $4) RETURNING id',
                [customerId, orderData.total, orderData.status, orderData.payment]
            );
            const orderId = orderResult.rows[0].id;

            // Add random order items
            for (let i = 0; i < orderData.items; i++) {
                const randomProduct = products[Math.floor(Math.random() * products.length)];
                const quantity = Math.floor(Math.random() * 3) + 1;

                await pool.query(
                    'INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase) VALUES ($1, $2, $3, $4, $5)',
                    [orderId, randomProduct.id, randomProduct.name, quantity, randomProduct.price]
                );
            }

            // Create payment record for delivered orders (not COD)
            if (orderData.status === 'delivered' && orderData.payment !== 'cod') {
                await pool.query(
                    `INSERT INTO payments 
                    (order_id, user_id, amount, currency, payment_gateway, payment_status, 
                     gateway_payment_id, gateway_order_id, payment_method_type, metadata) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [
                        orderId,
                        customerId,
                        orderData.total,
                        'INR',
                        orderData.payment,
                        'succeeded',
                        `pay_${orderData.payment}_${Date.now()}_${orderId}`,
                        `order_${orderData.payment}_${Date.now()}_${orderId}`,
                        'UPI',
                        JSON.stringify({ dummy: true })
                    ]
                );
            }

            console.log(`✓ Created order #${orderId} - ${orderData.status} - ₹${orderData.total} (${orderData.items} items)`);
        }

        console.log('\n✅ Successfully added 8 dummy orders!');

        const totalOrders = await pool.query('SELECT COUNT(*) FROM orders');
        const totalRevenue = await pool.query('SELECT SUM(total_amount) FROM orders WHERE status = $1', ['delivered']);
        console.log(`\n📊 Summary:`);
        console.log(`   Total orders: ${totalOrders.rows[0].count}`);
        console.log(`   Total revenue (delivered): ₹${parseFloat(totalRevenue.rows[0].sum || 0).toFixed(2)}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding dummy orders:', error.message);
        console.error(error);
        process.exit(1);
    }
}

addDummyOrders();
