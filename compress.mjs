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
            if (ext === '.jpg' || ext === '.jpeg') {
                const tempPath = fullPath + '.tmp.jpg';
                await sharp(fullPath)
                    .jpeg({ quality: 80, mozjpeg: true })
                    .toFile(tempPath);
                fs.renameSync(tempPath, fullPath);
                console.log(`Compressed: ${fullPath}`);
            } else if (ext === '.png') {
                const tempPath = fullPath + '.tmp.png';
                await sharp(fullPath)
                    .png({ quality: 80, compressionLevel: 9, palette: true })
                    .toFile(tempPath);
                fs.renameSync(tempPath, fullPath);
                console.log(`Compressed: ${fullPath}`);
            }
        }
    }
}

compressImages(directoryPath).then(() => {
    console.log('All images compressed successfully.');
}).catch(err => {
    console.error('Error compressing images:', err);
});
