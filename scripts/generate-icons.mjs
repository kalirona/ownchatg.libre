import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(__dirname, '../client/public/assets');

const BG = { r: 23, g: 23, b: 23 };
const FG = { r: 255, g: 255, b: 255 };

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const l = Buffer.alloc(4);
  l.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([l, t, data, crcBuf]);
}

function png(w, h) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const rs = 1 + w * 3;
  const raw = Buffer.alloc(rs * h);
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.32;
  for (let y = 0; y < h; y++) {
    const ro = y * rs;
    raw[ro] = 0;
    for (let x = 0; x < w; x++) {
      const po = ro + 1 + x * 3;
      const d = Math.hypot(x - cx, y - cy);
      if (d < r) { raw[po] = FG.r; raw[po + 1] = FG.g; raw[po + 2] = FG.b; }
      else { raw[po] = BG.r; raw[po + 1] = BG.g; raw[po + 2] = BG.b; }
    }
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const icons = [
  ['favicon-16x16.png', 16, 16],
  ['favicon-32x32.png', 32, 32],
  ['apple-touch-icon-180x180.png', 180, 180],
  ['icon-192x192.png', 192, 192],
  ['android-chrome-512x512.png', 512, 512],
  ['maskable-icon.png', 512, 512],
];

for (const [name, w, h] of icons) {
  fs.writeFileSync(path.join(ASSETS, name), png(w, h));
  console.log('✓', name, `(${w}×${h})`);
}
