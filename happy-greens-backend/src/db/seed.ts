import { pool } from './index';
import bcrypt from 'bcryptjs';

const categories = [
    { name: 'Fruits', slug: 'fruits', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&q=60' },
    { name: 'Vegetables', slug: 'vegetables', image: 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?auto=format&fit=crop&w=500&q=60' },
    { name: 'Dairy', slug: 'dairy', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=500&q=60' },
    { name: 'Staples', slug: 'staples', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=60' },
    { name: 'Snacks', slug: 'snacks', image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=500&q=60' },
    { name: 'Beverages', slug: 'beverages', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=60' },
    { name: 'Flowers', slug: 'flowers', image: 'https://images.unsplash.com/photo-1468327768560-75b778cbb551?auto=format&fit=crop&w=500&q=60' },
    { name: 'Laundromat', slug: 'laundromat', image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=500&q=60' },
    { name: 'Personal Care', slug: 'personal-care', image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=500&q=60' }
];

const products = [
    // Fruits
    { name: 'Fresh Apple', category: 'Fruits', price: 120, stock: 100, image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=500&q=60' },
    { name: 'Banana Robusta', category: 'Fruits', price: 40, stock: 150, image: 'https://images.unsplash.com/photo-1571771896612-610175226155?auto=format&fit=crop&w=500&q=60' },
    { name: 'Pomegranate', category: 'Fruits', price: 180, stock: 80, image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=60' },
    { name: 'Orange', category: 'Fruits', price: 80, stock: 120, image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=500&q=60' },
    { name: 'Grapes Black', category: 'Fruits', price: 90, stock: 60, image: 'https://images.unsplash.com/photo-1596363505729-4190a9506133?auto=format&fit=crop&w=500&q=60' },

    // Vegetables
    { name: 'Potato', category: 'Vegetables', price: 30, stock: 200, image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=60' },
    { name: 'Onion', category: 'Vegetables', price: 40, stock: 180, image: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=500&q=60' },
    { name: 'Tomato', category: 'Vegetables', price: 25, stock: 150, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=60' },
    { name: 'Spinach', category: 'Vegetables', price: 20, stock: 50, image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=60' },
    { name: 'Carrot', category: 'Vegetables', price: 50, stock: 90, image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=60' },

    // Dairy
    { name: 'Fresh Milk', category: 'Dairy', price: 60, stock: 50, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=500&q=60' },
    { name: 'Butter', category: 'Dairy', price: 250, stock: 40, image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=500&q=60' },
    { name: 'Cheese Slices', category: 'Dairy', price: 150, stock: 60, image: 'https://images.unsplash.com/photo-1624806992066-5ffcf7ca186b?auto=format&fit=crop&w=500&q=60' },
    { name: 'Yogurt', category: 'Dairy', price: 40, stock: 80, image: 'https://images.unsplash.com/photo-1562114808-b4b33cf60f4f?auto=format&fit=crop&w=500&q=60' },
    { name: 'Paneer', category: 'Dairy', price: 300, stock: 30, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=500&q=60' },

    // Staples
    { name: 'Basmati Rice', category: 'Staples', price: 150, stock: 100, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=60' },
    { name: 'Wheat Flour', category: 'Staples', price: 45, stock: 120, image: 'https://images.unsplash.com/photo-1627485937980-221c88ac04f9?auto=format&fit=crop&w=500&q=60' },
    { name: 'Toor Dal', category: 'Staples', price: 110, stock: 80, image: 'https://images.unsplash.com/photo-1585996687439-54e26cd2e10c?auto=format&fit=crop&w=500&q=60' },
    { name: 'Sugar', category: 'Staples', price: 42, stock: 150, image: 'https://images.unsplash.com/photo-1612203985729-70726954388c?auto=format&fit=crop&w=500&q=60' },
    { name: 'Salt', category: 'Staples', price: 20, stock: 200, image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=500&q=60' },

    // Snacks
    { name: 'Potato Chips', category: 'Snacks', price: 30, stock: 100, image: 'https://images.unsplash.com/photo-1566478919030-26d9c2865e3d?auto=format&fit=crop&w=500&q=60' },
    { name: 'Biscuits', category: 'Snacks', price: 20, stock: 150, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=500&q=60' },
    { name: 'Nuts Mix', category: 'Snacks', price: 400, stock: 40, image: 'https://images.unsplash.com/photo-1605193721643-754d38995530?auto=format&fit=crop&w=500&q=60' },
    { name: 'Popcorn', category: 'Snacks', price: 50, stock: 80, image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=500&q=60' },
    { name: 'Chocolate Bar', category: 'Snacks', price: 60, stock: 100, image: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=500&q=60' },

    // Beverages
    { name: 'Orange Juice', category: 'Beverages', price: 120, stock: 60, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' },
    { name: 'Green Tea', category: 'Beverages', price: 250, stock: 50, image: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?auto=format&fit=crop&w=500&q=60' },
    { name: 'Coffee Powder', category: 'Beverages', price: 300, stock: 40, image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=500&q=60' },
    { name: 'Soda Can', category: 'Beverages', price: 40, stock: 100, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=60' },
    { name: 'Mineral Water', category: 'Beverages', price: 20, stock: 200, image: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=500&q=60' },

    // Flowers
    { name: 'Pink Dahlia', category: 'Flowers', price: 180, stock: 40, image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=500&q=60' },
    { name: 'Rose Bouquet', category: 'Flowers', price: 320, stock: 25, image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=500&q=60' },

    // Laundromat
    { name: 'Laundry Detergent', category: 'Laundromat', price: 240, stock: 60, image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=500&q=60' },
    { name: 'Fabric Softener', category: 'Laundromat', price: 190, stock: 50, image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=500&q=60' },

    // Personal Care
    { name: 'Herbal Shampoo', category: 'Personal Care', price: 210, stock: 70, image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=500&q=60' },
    { name: 'Body Wash', category: 'Personal Care', price: 165, stock: 75, image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=500&q=60' }
];

const seed = async () => {
    try {
        console.log('🌱 Seeding database...');

        // Clear existing data
        await pool.query('TRUNCATE TABLE payments, order_items, orders, cart_items, carts, products, categories, users RESTART IDENTITY CASCADE');
        console.log('✓ Cleared existing data');

        // Create categories
        console.log('📁 Creating categories...');
        const categoryMap = new Map();
        for (const cat of categories) {
            const res = await pool.query(
                'INSERT INTO categories (name, slug, image_url) VALUES ($1, $2, $3) RETURNING id, name',
                [cat.name, cat.slug, cat.image]
            );
            categoryMap.set(res.rows[0].name, res.rows[0].id);
        }
        console.log(`✓ Created ${categories.length} categories`);

        // Create products
        console.log('🛒 Creating products...');
        const productIds: number[] = [];
        for (const prod of products) {
            const catId = categoryMap.get(prod.category);
            const res = await pool.query(
                'INSERT INTO products (name, description, price, stock_quantity, category_id, image_url, is_featured) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
                [prod.name, `Fresh ${prod.name} from Happy Greens.`, prod.price, prod.stock, catId, prod.image, Math.random() < 0.2]
            );
            productIds.push(res.rows[0].id);
        }
        console.log(`✓ Created ${products.length} products`);

        // Create admin user
        console.log('👤 Creating admin user...');
        const adminSalt = await bcrypt.genSalt(10);
        const adminHash = await bcrypt.hash('admin123', adminSalt);
        const adminResult = await pool.query(
            'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id',
            ['admin@happygreens.com', adminHash, 'Admin User', 'admin']
        );
        console.log('✓ Admin user created: admin@happygreens.com / admin123');

        // Create test customer
        console.log('👤 Creating test customer...');
        const customerSalt = await bcrypt.genSalt(10);
        const customerHash = await bcrypt.hash('customer123', customerSalt);
        const customerResult = await pool.query(
            'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id',
            ['customer@test.com', customerHash, 'John Doe', 'customer']
        );
        const customerId = customerResult.rows[0].id;
        console.log('✓ Test customer created: customer@test.com / customer123');

        // Create test order with items
        console.log('📦 Creating test order...');
        const orderTotal = 500.00;
        const orderResult = await pool.query(
            'INSERT INTO orders (user_id, total_amount, status, payment_method) VALUES ($1, $2, $3, $4) RETURNING id',
            [customerId, orderTotal, 'paid', 'razorpay']
        );
        const orderId = orderResult.rows[0].id;

        // Add order items (5 products)
        const orderItems = [
            { productId: productIds[0], name: products[0].name, quantity: 2, price: products[0].price },  // Fresh Apple
            { productId: productIds[10], name: products[10].name, quantity: 1, price: products[10].price }, // Fresh Milk
            { productId: productIds[6], name: products[6].name, quantity: 3, price: products[6].price },   // Onion
            { productId: productIds[7], name: products[7].name, quantity: 2, price: products[7].price },   // Tomato
            { productId: productIds[15], name: products[15].name, quantity: 1, price: products[15].price }  // Basmati Rice
        ];

        for (const item of orderItems) {
            await pool.query(
                'INSERT INTO order_items (order_id, product_id, product_name, quantity, price_at_purchase) VALUES ($1, $2, $3, $4, $5)',
                [orderId, item.productId, item.name, item.quantity, item.price]
            );
        }
        console.log(`✓ Created order #${orderId} with ${orderItems.length} items`);

        // Create payment record
        console.log('💳 Creating payment record...');
        await pool.query(
            `INSERT INTO payments 
            (order_id, user_id, amount, currency, payment_gateway, payment_status, 
             gateway_payment_id, gateway_order_id, payment_method_type, metadata) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                orderId,
                customerId,
                orderTotal,
                'INR',
                'razorpay',
                'succeeded',
                'pay_test_' + Date.now(),
                'order_test_' + Date.now(),
                'UPI',
                JSON.stringify({ test: true })
            ]
        );
        console.log('✓ Payment record created');

        console.log('\n✅ Seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   Categories: ${categories.length}`);
        console.log(`   Products: ${products.length}`);
        console.log(`   Admin: admin@happygreens.com / admin123`);
        console.log(`   Customer: customer@test.com / customer123`);
        console.log(`   Test Order ID: ${orderId} (paid)`);
        console.log('\n🚀 Ready for testing!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seed();
