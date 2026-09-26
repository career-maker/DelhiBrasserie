import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, 'assets/images');

async function compressImages(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            await compressImages(fullPath);
        } else {
            const ext = path.extname(fullPath).toLowerCase();
            if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
                const webpPath = fullPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                if (!fs.existsSync(webpPath)) {
                    await sharp(fullPath)
                        .webp({ quality: 80 })
                        .toFile(webpPath);
                    console.log(`Converted to webp: ${webpPath}`);
                }
            }
        }
    }
}

compressImages(directoryPath).then(() => {
    console.log('All images compressed successfully.');
}).catch(err => {
    console.error('Error compressing images:', err);
});
