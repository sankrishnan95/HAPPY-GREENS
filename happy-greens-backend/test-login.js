const axios = require('axios');

async function testLogin() {
    try {
        console.log('🔐 Testing login endpoint...');
        console.log('Email: admin@happygreens.com');
        console.log('Password: admin123');
        console.log('');

        const response = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@happygreens.com',
            password: 'admin123'
        });

        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('');
        console.log('Response:');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('');
        console.log('Token:', response.data.token?.substring(0, 50) + '...');
        console.log('User:', response.data.user);
    } catch (error) {
        console.error('❌ LOGIN FAILED!');
        console.error('');
        console.error('Status:', error.response?.status);
        console.error('Message:', error.response?.data?.message || error.message);
        console.error('');
        console.error('Full error:', error.response?.data);
    }
}

testLogin();
