/**
 * Generates PNG icon files for the Fossiq app using pure TypeScript + Bun built-ins.
 * No native dependencies required.
 */

import { join } from "path";
import { encodePng } from "./png-encode.js";

const publicDir = join(import.meta.dir, "../public");

function drawStrokedLine(
  rgba: Uint8Array,
  size: number,
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

  const half = strokeWidth / 2;

  const minX = Math.max(0, Math.floor(Math.min(x0, x1) - half));
  const maxX = Math.min(size - 1, Math.ceil(Math.max(x0, x1) + half));
  const minY = Math.max(0, Math.floor(Math.min(y0, y1) - half));
  const maxY = Math.min(size - 1, Math.ceil(Math.max(y0, y1) + half));

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
        const idx = (py * size + px) * 4;
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
