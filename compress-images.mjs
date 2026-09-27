import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const images = [
    { file: 'assets/images/reviews-watermark.webp', width: null },
    { file: 'assets/images/home-watermark.webp', width: null },
    { file: 'assets/images/restaurant/sign-1.webp', width: 600 },
    { file: 'assets/images/restaurant/table-1.webp', width: 800 },
    { file: 'assets/images/restaurant/storefront.webp', width: 1200 },
    { file: 'assets/images/restaurant/detail-elephant.webp', width: 800 },
    { file: 'assets/images/restaurant/hall-3.webp', width: 800 },
    { file: 'assets/images/restaurant/hall-1.webp', width: 1200 },
    { file: 'assets/images/restaurant/hall-4.webp', width: 800 },
    { file: 'assets/images/restaurant/room-3.webp', width: 1200 }
];

async function processImages() {
    for (const img of images) {
        const filePath = path.resolve(img.file);
        
        if (fs.existsSync(filePath)) {
            const buffer = fs.readFileSync(filePath);
            let s = sharp(buffer);
            if (img.width) {
                s = s.resize({ width: img.width, withoutEnlargement: true });
            }
            s = s.webp({ quality: 65, effort: 6 });
            
            const outBuffer = await s.toBuffer();
            fs.writeFileSync(filePath, outBuffer);
            console.log(`Processed ${img.file}`);
        } else {
            console.log(`Not found ${img.file}`);
        }
    }
}

processImages();
