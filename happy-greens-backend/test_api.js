const http = require('http');

http.get('http://localhost:3000/api/products?limit=1', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const products = JSON.parse(data).products;
        const imgUrl = products[0].images[1] || products[0].images[0];
        console.log(`Testing image request to: ${imgUrl}`);
        if (imgUrl.includes('localhost')) {
            http.get(imgUrl, (imgRes) => {
                console.log(`Image response code: ${imgRes.statusCode}`);
            });
        }
    });
});
