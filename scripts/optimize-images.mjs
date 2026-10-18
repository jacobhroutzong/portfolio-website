import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
const root = resolve(dirname(fileURLToPath(import.meta.url)),'..');
const media = resolve(root,'public/media');
const manifest = {};
async function walk(dir) {
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    if (entry.name === 'generated') continue;
    const path = resolve(dir,entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(png|jpe?g|webp|avif)$/i.test(entry.name)) {
      const local = relative(media,path).replaceAll('\\','/');
      const source = `/media/${local}`;
      const metadata = await sharp(path).rotate().metadata();
      // EXIF orientations 5–8 exchange width and height after rotation.
      const swap = metadata.orientation >= 5 && metadata.orientation <= 8;
      const width = swap ? metadata.height : metadata.width;
      const height = swap ? metadata.width : metadata.height;
      if (!width || !height) throw new Error(`Cannot read image dimensions: ${local}`);
      const widths = [...new Set([480,960,1440,width].filter(w => w <= width && w <= 1920))];
      if (!widths.length) widths.push(Math.min(width,1920));
      const variants = [];
      for (const w of widths) {
        const name = `${local}-${w}.webp`;
        const destination = resolve(media,'generated',name);
        await mkdir(dirname(destination),{recursive:true});
        await sharp(path).rotate().resize({width:w,withoutEnlargement:true}).webp({quality:82}).toFile(destination);
        variants.push({src:`/media/generated/${name}`,width:w});
      }
      manifest[source] = {width,height,src:variants.at(-1).src,srcSet:variants.map(v => `${v.src} ${v.width}w`).join(', ')};
    }
  }
}
await walk(media);
await writeFile(resolve(root,'src/data/images.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Optimized ${Object.keys(manifest).length} raster images; SVG diagrams remain resolution independent.`);
