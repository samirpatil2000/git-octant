import fs from 'fs';
import path from 'path';

// Simple pure Node.js generator for valid PNG icons
// Or SVG icons if supported, with raw fallback PNG buffers

function generateSimplePng(size) {
  // A minimal valid RGBA PNG generator
  // We can write clean PNG format bytes or create an SVG and rasterize/output
  // Even simpler: create a minimal RGBA PNG with blue/dark gradient and center circle
  const width = size;
  const height = size;

  // Let's create an uncompressed PNG structure using zlib
  import('zlib').then(({ deflateSync }) => {
    const rawData = Buffer.alloc(height * (width * 4 + 1));
    let offset = 0;

    for (let y = 0; y < height; y++) {
      rawData[offset++] = 0; // filter type 0: None
      for (let x = 0; x < width; x++) {
        // Distance from center
        const dx = x - width / 2;
        const dy = y - height / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = width * 0.44;

        if (dist <= radius) {
          // Inside icon circle: sleek dark obsidian / brand blue accent
          const innerDist = Math.sqrt(dx * dx + dy * dy);
          if (innerDist < width * 0.2) {
            // Center white/light accent
            rawData[offset++] = 255;
            rawData[offset++] = 255;
            rawData[offset++] = 255;
            rawData[offset++] = 255;
          } else {
            // Dark cockpit slate #181b22
            rawData[offset++] = 24;
            rawData[offset++] = 27;
            rawData[offset++] = 34;
            rawData[offset++] = 255;
          }
        } else {
          // Transparent outside
          rawData[offset++] = 0;
          rawData[offset++] = 0;
          rawData[offset++] = 0;
          rawData[offset++] = 0;
        }
      }
    }

    const compressed = deflateSync(rawData);

    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR
    const ihdr = Buffer.alloc(13 + 12);
    ihdr.writeUInt32BE(13, 0);
    ihdr.write('IHDR', 4);
    ihdr.writeUInt32BE(width, 8);
    ihdr.writeUInt32BE(height, 12);
    ihdr[16] = 8; // bit depth
    ihdr[17] = 6; // color type: RGBA
    ihdr[18] = 0; // compression
    ihdr[19] = 0; // filter
    ihdr[20] = 0; // interlace

    // CRC for IHDR
    const ihdrCrc = crc32(ihdr.subarray(4, 21));
    ihdr.writeUInt32BE(ihdrCrc, 21);

    // IDAT
    const idat = Buffer.alloc(compressed.length + 12);
    idat.writeUInt32BE(compressed.length, 0);
    idat.write('IDAT', 4);
    compressed.copy(idat, 8);
    const idatCrc = crc32(idat.subarray(4, 8 + compressed.length));
    idat.writeUInt32BE(idatCrc, 8 + compressed.length);

    // IEND
    const iend = Buffer.alloc(12);
    iend.writeUInt32BE(0, 0);
    iend.write('IEND', 4);
    const iendCrc = crc32(iend.subarray(4, 8));
    iend.writeUInt32BE(iendCrc, 8);

    const png = Buffer.concat([signature, ihdr, idat, iend]);

    const iconsDir = path.resolve('./public/icons');
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), png);
    console.log(`Generated public/icons/icon-${size}.png (${size}x${size})`);
  });
}

// Simple CRC32 table & function for PNG
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

[16, 32, 48, 128].forEach(generateSimplePng);
