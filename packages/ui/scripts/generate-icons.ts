/**
 * Generates PNG icon files for the Fossiq app using pure TypeScript + Bun built-ins.
 * No native dependencies required.
 */

import { join } from "path";

const publicDir = join(import.meta.dir, "../public");

function crc32(data: Uint8Array): number {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (const byte of data) crc = table[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function uint32BE(n: number): Uint8Array {
  return new Uint8Array([(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]);
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const typeAndData = new Uint8Array(typeBytes.length + data.length);
  typeAndData.set(typeBytes);
  typeAndData.set(data, typeBytes.length);
  const crc = crc32(typeAndData);
  const result = new Uint8Array(4 + 4 + data.length + 4);
  result.set(uint32BE(data.length), 0);
  result.set(typeBytes, 4);
  result.set(data, 8);
  result.set(uint32BE(crc), 8 + data.length);
  return result;
}

function encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  // compression, filter, interlace = 0

  const rawRows = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawRows[y * (1 + width * 4)] = 0; // filter: None
    rawRows.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (1 + width * 4) + 1);
  }

  const compressed = Bun.deflateSync(rawRows);
  const ihdr = chunk("IHDR", ihdrData);
  const idat = chunk("IDAT", compressed);
  const iend = chunk("IEND", new Uint8Array(0));

  const result = new Uint8Array(signature.length + ihdr.length + idat.length + iend.length);
  let offset = 0;
  for (const part of [signature, ihdr, idat, iend]) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function drawStrokedLine(
  rgba: Uint8Array,
  width: number,
  x0: number, y0: number,
  x1: number, y1: number,
  strokeWidth: number,
  r: number, g: number, b: number,
  a: number = 255
): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;

  const nx = -dy / len;
  const ny = dx / len;
  const half = strokeWidth / 2;

  const minX = Math.max(0, Math.floor(Math.min(x0, x1) - half));
  const maxX = Math.min(width - 1, Math.ceil(Math.max(x0, x1) + half));
  const minY = Math.max(0, Math.floor(Math.min(y0, y1) - half));
  const maxY = Math.min(width - 1, Math.ceil(Math.max(y0, y1) + half));

  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      // Distance from point to line segment
      const tx = px - x0;
      const ty = py - y0;
      const t = Math.max(0, Math.min(1, (tx * dx + ty * dy) / (len * len)));
      const closestX = x0 + t * dx;
      const closestY = y0 + t * dy;
      const dist = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);

      if (dist <= half) {
        const alpha = dist > half - 1 ? Math.round(255 * (half - dist)) : a;
        const idx = (py * width + px) * 4;
        // Alpha blend
        const srcA = alpha / 255;
        const dstA = rgba[idx + 3]! / 255;
        const outA = srcA + dstA * (1 - srcA);
        if (outA > 0) {
          rgba[idx] = Math.round((r * srcA + rgba[idx]! * dstA * (1 - srcA)) / outA);
          rgba[idx + 1] = Math.round((g * srcA + rgba[idx + 1]! * dstA * (1 - srcA)) / outA);
          rgba[idx + 2] = Math.round((b * srcA + rgba[idx + 2]! * dstA * (1 - srcA)) / outA);
          rgba[idx + 3] = Math.round(outA * 255);
        }
      }
    }
  }
}

function generateIcon(size: number): Uint8Array {
  const rgba = new Uint8Array(size * size * 4);
  // White background
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = 255;
    rgba[i * 4 + 1] = 255;
    rgba[i * 4 + 2] = 255;
    rgba[i * 4 + 3] = 255;
  }

  const s = size / 192;
  const outerW = 24 * s;
  const innerW = 12 * s;

  // Logo paths scaled to target size (original viewBox: 192x192)
  const segments: [number, number, number, number][] = [
    [64 * s, 64 * s, 32 * s, 96 * s],   // M64 64 L32 96
    [32 * s, 96 * s, 64 * s, 128 * s],   // L32 96 l32 32  (<)
    [128 * s, 64 * s, 160 * s, 96 * s],  // M128 64 l32 32
    [160 * s, 96 * s, 128 * s, 128 * s], // l32 32 -32 32  (>)
    [96 * s, 48 * s, 96 * s, 144 * s],   // M96 48 v96     (|)
  ];

  // Draw outer white stroke first
  for (const [x0, y0, x1, y1] of segments) {
    drawStrokedLine(rgba, size, x0, y0, x1, y1, outerW, 255, 255, 255);
  }
  // Draw inner dark blue stroke on top
  for (const [x0, y0, x1, y1] of segments) {
    drawStrokedLine(rgba, size, x0, y0, x1, y1, innerW, 12, 59, 102);
  }

  return encodePng(size, size, rgba);
}

for (const size of [192, 512]) {
  const png = generateIcon(size);
  const path = join(publicDir, `icon-${size}.png`);
  await Bun.write(path, png);
  console.log(`Generated ${path} (${png.length} bytes)`);
}
