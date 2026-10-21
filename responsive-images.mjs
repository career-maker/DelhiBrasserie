// Writes smaller copies (name-480.webp, -800, -1200) of the photos under assets/images/{restaurant,live},
// plus logo-320.webp. build.mjs adds the matching srcset to each <img>. Run: npm run images
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const WIDTHS = [480, 800, 1200];
const dirs = ['assets/images/restaurant', 'assets/images/live'];

for (const dir of dirs) {
  for (const f of fs.readdirSync(dir)) {
    if (!/^[^.]+\.webp$/.test(f) || /-\d+\.webp$/.test(f)) continue;
    const src = path.join(dir, f);
    const { width } = await sharp(src).metadata();
    for (const w of WIDTHS) {
      if (w >= width) continue;
      await sharp(src).resize({ width: w }).webp({ quality: 66, effort: 5 }).toFile(path.join(dir, f.replace('.webp', `-${w}.webp`)));
    }
  }
}
await sharp('assets/images/logo.png').resize({ width: 320 }).webp({ quality: 85, effort: 6 }).toFile('assets/images/logo-320.webp');
console.log('done');
