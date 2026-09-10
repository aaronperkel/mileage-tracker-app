import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

/*
 * Home-screen icons, rendered from the odometer strip rather than a glyph.
 *
 * The app is one instrument, so its icon is that instrument: four graphite
 * drums and the brick tenths drum, which is the only thing on the phone's home
 * screen that will look like this. Regenerate with `npm run icons` if the drum
 * colours in globals.css change.
 */

const DRUM = '#23262a';
const DRUM_EDGE = '#34383d';
const DRUM_SHADOW = '#131518';
const DRUM_INK = '#f2f1ed';
const TENTH = '#a8432a';
const TENTH_EDGE = '#c25a3c';
const GROUND = '#f4f6f6';

/** The reading on the icon. Five drums fit legibly at 192px; six do not. */
const READING = ['0', '9', '9', '8', '0'];
const TENTH_DIGIT = '1';

function svg(size: number, margin: number): string {
  const inner = size - margin * 2;
  const count = READING.length + 1;
  const gap = inner * 0.012;
  const drumWidth = (inner - gap * (count - 1)) / count;
  const drumHeight = inner * 0.62;
  const top = (size - drumHeight) / 2;
  /* Digits sit inside the drum, never over its edges — 0.74 spilled. */
  const fontSize = drumHeight * 0.5;

  const drums = [...READING, TENTH_DIGIT]
    .map((digit, index) => {
      const isTenth = index === READING.length;
      const x = margin + index * (drumWidth + gap);
      return `
    <rect x="${x}" y="${top}" width="${drumWidth}" height="${drumHeight}" rx="${size * 0.012}"
          fill="url(#${isTenth ? 'tenth' : 'drum'})"/>
    <text x="${x + drumWidth / 2}" y="${top + drumHeight / 2}" fill="${DRUM_INK}"
          font-family="Barlow Semi Condensed, Helvetica Neue, Arial, sans-serif"
          font-size="${fontSize}" font-weight="600" text-anchor="middle"
          dominant-baseline="central">${digit}</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="drum" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${DRUM_EDGE}"/>
      <stop offset="44%" stop-color="${DRUM}"/>
      <stop offset="100%" stop-color="${DRUM_SHADOW}"/>
    </linearGradient>
    <linearGradient id="tenth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${TENTH_EDGE}"/>
      <stop offset="44%" stop-color="${TENTH}"/>
      <stop offset="100%" stop-color="${TENTH}" stop-opacity="0.82"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="${GROUND}"/>${drums}
</svg>`;
}

async function render(name: string, size: number, margin: number) {
  await writeFile(`public/${name}`, await sharp(Buffer.from(svg(size, margin))).png().toBuffer());
  console.log(`  public/${name}`);
}

async function main() {
  await mkdir('public', { recursive: true });
  console.log('Rendering icons:');
  await render('icon-192.png', 192, 16);
  await render('icon-512.png', 512, 42);
  /* Android crops to its own shape, so this one carries the extra safe margin. */
  await render('icon-maskable-512.png', 512, 96);
  await render('apple-touch-icon.png', 180, 14);
}

main().catch((error: unknown) => {
  console.error('Icon render failed:', error);
  process.exit(1);
});
