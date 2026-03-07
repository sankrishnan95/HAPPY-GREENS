import { pool } from './src/db/index';

const addDummyOrders = async () => {
    try {
        console.log('📦 Adding dummy orders...');

        // Get existing users and products
        const usersResult = await pool.query('SELECT id FROM users WHERE role = $1', ['customer']);
        const productsResult = await pool.query('SELECT id, name, price FROM products LIMIT 20');

        if (usersResult.rows.length === 0) {
            console.log('⚠️ No customer users found. Creating a test customer first...');
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('customer123', salt);
            const newCustomer = await pool.query(
                'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id',
                ['customer@test.com', hash, 'John Doe', 'customer']
            );
            usersResult.rows.push(newCustomer.rows[0]);
        }

        const customerId = usersResult.rows[0].id;
        const products = productsResult.rows;

        // Order statuses and payment methods
        const statuses = ['pending', 'processing', 'shipped', 'delivered', 'paid'];
        const paymentMethods = ['razorpay', 'stripe', 'cod'];
        const paymentStatuses = ['succeeded', 'pending', 'failed'];

        // Create 15 dummy orders (using only valid statuses: pending, paid, cancelled)
        const ordersToCreate = [
            { total: 850.00, status: 'paid', payment: 'razorpay', items: 5, date: new Date('2026-02-10') },
            { total: 1250.00, status: 'paid', payment: 'stripe', items: 8, date: new Date('2026-02-11') },
            { total: 450.00, status: 'paid', payment: 'razorpay', items: 3, date: new Date('2026-02-12') },
            { total: 2100.00, status: 'pending', payment: 'cod', items: 12, date: new Date('2026-02-13') },
            { total: 680.00, status: 'paid', payment: 'razorpay', items: 4, date: new Date('2026-02-13') },
            { total: 920.00, status: 'paid', payment: 'stripe', items: 6, date: new Date('2026-02-09') },
            { total: 1500.00, status: 'paid', payment: 'razorpay', items: 10, date: new Date('2026-02-08') },
            { total: 350.00, status: 'pending', payment: 'cod', items: 2, date: new Date('2026-02-14') },
            { total: 1800.00, status: 'paid', payment: 'stripe', items: 9, date: new Date('2026-02-12') },
            { total: 550.00, status: 'paid', payment: 'razorpay', items: 4, date: new Date('2026-02-07') },
            { total: 1100.00, status: 'paid', payment: 'razorpay', items: 7, date: new Date('2026-02-13') },
            { total: 780.00, status: 'paid', payment: 'cod', items: 5, date: new Date('2026-02-06') },
            { total: 2500.00, status: 'paid', payment: 'stripe', items: 15, date: new Date('2026-02-05') },
            { total: 420.00, status: 'paid', payment: 'razorpay', items: 3, date: new Date('2026-02-14') },
            { total: 960.00, status: 'cancelled', payment: 'stripe', items: 6, date: new Date('2026-02-11') },
        ];

        for (const orderData of ordersToCreate) {
            // Create order
            const orderResult = await pool.query(
                'INSERT INTO orders (user_id, total_amount, status, payment_method, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [customerId, orderData.total, orderData.status, orderData.payment, orderData.date]
            );
            const orderId = orderResult.rows[0].id;

            // Add random order items
            let itemsAdded = 0;
            const selectedProducts = new Set();

            while (itemsAdded < orderData.items && selectedProducts.size < products.length) {
                const randomProduct = products[Math.floor(Math.random() * products.length)];

                if (!selectedProducts.has(randomProduct.id)) {
                    selectedProducts.add(randomProduct.id);
                    const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items

                    await pool.query(
                        'INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase) VALUES ($1, $2, $3, $4, $5)',
                        [orderId, randomProduct.id, randomProduct.name, quantity, randomProduct.price]
                    );
                    itemsAdded++;
                }
            }

            // Create payment record for paid orders (excluding COD)
            if (orderData.status === 'paid' && orderData.payment !== 'cod') {
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
                        JSON.stringify({ dummy: true, created_at: orderData.date })
                    ]
                );
            }

            console.log(`✓ Created order #${orderId} - ${orderData.status} - ₹${orderData.total} (${orderData.items} items)`);
        }

        console.log('\n✅ Successfully added 15 dummy orders!');
        console.log('\n📊 Summary:');
        const totalOrders = await pool.query('SELECT COUNT(*) FROM orders');
        const totalRevenue = await pool.query('SELECT SUM(total_amount) FROM orders WHERE status IN ($1, $2, $3)', ['paid', 'delivered', 'shipped']);
        console.log(`   Total Orders: ${totalOrders.rows[0].count}`);
        console.log(`   Total Revenue: ₹${parseFloat(totalRevenue.rows[0].sum || 0).toFixed(2)}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding dummy orders:', error);
        process.exit(1);
    }
};

addDummyOrders();
