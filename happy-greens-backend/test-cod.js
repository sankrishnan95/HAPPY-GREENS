const auth = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test COD User 2',
                email: 'testcod' + Date.now() + '@example.com',
                password: 'password123'
            })
        });
        const data = await res.json();
        const token = data.token;
        console.log('Token lengths:', token?.length);

        const orderRes = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                items: [{ product_id: 1, product_name: 'Fresh Apple', quantity: 2, price: 50 }],
                totalAmount: 100,
                shippingAddress: { address: '123 Test St', city: 'Test City', zip: '12345' },
                paymentMethod: 'cod',
                paymentIntentId: null
            })
        });

        const orderData = await orderRes.json();
        console.log('Order Response:', orderRes.status, orderData);
    } catch (e) {
        console.error('Error:', e);
    }
};

auth();
