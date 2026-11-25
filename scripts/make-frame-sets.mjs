// Builds the lighter 1280px frame set (public/media/film2/sd) from the 1920px set (public/media/film2/hd).
// Run after replacing the film:  npm run frames
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "public/media/film2/hd";
const OUT = "public/media/film2/sd";
await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => f.endsWith(".webp")).sort();
let bytes = 0;
for (const f of files) {
  const info = await sharp(path.join(SRC, f))
    .resize({ width: 1280 })
    .sharpen({ sigma: 0.5 })
    .webp({ quality: 64, effort: 6 })
    .toFile(path.join(OUT, f));
  bytes += info.size;
}
console.log(`${files.length} frames → ${OUT} (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
