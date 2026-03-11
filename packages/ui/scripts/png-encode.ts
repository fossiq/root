/**
 * PNG encoding helpers: CRC32, chunk writing, raw RGBA → PNG bytes.
 */

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

export function encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
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
