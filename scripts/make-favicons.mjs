/**
 * Builds the site's favicons from the firm's logo.
 *
 *   node scripts/make-favicons.mjs
 *
 * The client's brief: use the logo EMBLEM only - the building mark - with none of
 * the small wordmark text, because at 16px the Hebrew lettering is an unreadable
 * smudge. So we crop the emblem out of public/logo.png rather than shrinking the
 * whole lockup, and set it in bright teal on the brand navy: the emblem's own teal
 * is thin-stroked and disappears against a dark browser tab.
 *
 * Re-run this if the logo ever changes. EMBLEM below is a pixel box inside
 * public/logo.png (1836x552); it was measured from the alpha channel, so it will
 * need re-measuring if the artwork is replaced.
 */
import { Buffer } from 'node:buffer';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// sharp takes paths, not URL objects.
const LOGO = fileURLToPath(new URL('../public/logo.png', import.meta.url));
const OUT = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

const EMBLEM = { left: 1472, top: 61, width: 304, height: 431 };
const NAVY = { r: 0x06, g: 0x19, b: 0x22, alpha: 1 }; // --c-navy-deep
const TEAL = { r: 0x6f, g: 0xc9, b: 0xe8 }; // --c-teal-bright: 9.6:1 on the navy
const PADDING = 0.16; // share of the tile left clear on the emblem's long axis

/** The emblem's silhouette, repainted in `TEAL`, sized to `box` px on its long axis. */
async function emblem(box) {
  const scale = box / EMBLEM.height; // portrait mark - height is the long axis
  const width = Math.max(1, Math.round(EMBLEM.width * scale));
  const height = Math.max(1, Math.round(EMBLEM.height * scale));

  // The mark is teal strokes on transparency, so its alpha IS its silhouette.
  // Recolour by keeping that alpha and replacing the RGB underneath it.
  const alpha = await sharp(LOGO)
    .extract(EMBLEM)
    .resize(width, height, { fit: 'fill', kernel: 'lanczos3' })
    .ensureAlpha()
    .extractChannel(3)
    .toBuffer();

  return sharp({
    create: { width, height, channels: 3, background: TEAL },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer();
}

/** One square icon: the emblem centred on a solid navy tile. */
async function tile(size) {
  const mark = await emblem(Math.round(size * (1 - 2 * PADDING)));
  return sharp({
    create: { width: size, height: size, channels: 4, background: NAVY },
  })
    .composite([{ input: mark, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * An .ico is a tiny container: a 6-byte header, one 16-byte directory entry per
 * image, then the images themselves. Every browser since IE11 reads PNG payloads
 * inside it, so we embed the PNGs we already have rather than encoding BMP.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(16 * images.length);
  let offset = header.length + directory.length;

  images.forEach(({ size, png }, i) => {
    const at = i * 16;
    directory.writeUInt8(size >= 256 ? 0 : size, at + 0); // 0 means 256
    directory.writeUInt8(size >= 256 ? 0 : size, at + 1);
    directory.writeUInt8(0, at + 2); // palette colours
    directory.writeUInt8(0, at + 3); // reserved
    directory.writeUInt16LE(1, at + 4); // colour planes
    directory.writeUInt16LE(32, at + 6); // bits per pixel
    directory.writeUInt32LE(png.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += png.length;
  });

  return Buffer.concat([header, directory, ...images.map((i) => i.png)]);
}

const SIZES = [16, 32, 48, 180, 192, 512];
const built = new Map();
for (const size of SIZES) built.set(size, await tile(size));

await writeFile(OUT('favicon-16.png'), built.get(16));
await writeFile(OUT('favicon-32.png'), built.get(32));
// Google wants a search-result favicon that is a multiple of 48x48.
await writeFile(OUT('favicon-96.png'), await tile(96));
await writeFile(OUT('apple-touch-icon.png'), built.get(180));
await writeFile(OUT('icon-192.png'), built.get(192));
await writeFile(OUT('icon-512.png'), built.get(512));
await writeFile(
  OUT('favicon.ico'),
  ico([16, 32, 48].map((size) => ({ size, png: built.get(size) }))),
);

console.log('favicons written to public/');
