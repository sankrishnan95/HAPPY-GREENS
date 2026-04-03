const https = require('https');
const fs = require('fs');
const path = require('path');

const images = [
    { name: 'apple', url: 'https://www.freepnglogos.com/uploads/apple/apple-fruit-png-2.png' },
    { name: 'broccoli', url: 'https://www.freepnglogos.com/uploads/broccoli-png/broccoli-vegetables-png-images-12.png' },
    { name: 'milk', url: 'https://www.freepnglogos.com/uploads/milk-png/milk-png-cow-milk-transparent-png-pictures-34.png' },
    { name: 'rice', url: 'https://www.freepnglogos.com/uploads/rice-png/bowl-of-rice-png-2.png' },
    { name: 'chips', url: 'https://www.freepnglogos.com/uploads/chips-png/chips-lays-classic-15.png' },
    { name: 'juice', url: 'https://www.freepnglogos.com/uploads/drinks-png/drinks-juice-transparent-picture-17.png' },
    { name: 'rose', url: 'https://www.freepnglogos.com/uploads/rose/red-rose-png-transparent-image-pngpix-28.png' },
    { name: 'washing_machine', url: 'https://www.freepnglogos.com/uploads/washing-machine-png/washing-machine-buy-appliancess-and-electronics-home-14.png' },
    { name: 'shampoo', url: 'https://www.freepnglogos.com/uploads/shampoo-png/shampoo-lotion-bottle-png-transparent-image-purepng-34.png' }
];

const downloadImage = (url, name) => {
    return new Promise((resolve) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (res) => {
            if (res.statusCode !== 200) {
                console.error(`Failed to download ${name}: ${res.statusCode}`);
                return resolve();
            }
            const file = fs.createWriteStream(path.join(__dirname, 'happy-greens-frontend/public/categories', `${name}.png`));
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Downloaded ${name}.png`);
                resolve();
            });
        }).on('error', (err) => {
            console.error(`Error downloading ${name}: ${err.message}`);
            resolve();
        });
    });
};

(async () => {
    for (const img of images) {
        await downloadImage(img.url, img.name);
    }
})();
