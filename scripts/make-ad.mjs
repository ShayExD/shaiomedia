/**
 * Render the static creative for ChatGPT Ads.
 *
 * The card renders the image as a small square beside the headline — the spec
 * is 1:1 and it is displayed at roughly 256px. Everything here is sized for
 * that: few elements, one focal line, and type that survives being shrunk to a
 * quarter of its rendered size. A creative that only works at full size reads
 * as noise in the slot it actually occupies.
 *
 * Two variants ship so the choice is made by looking rather than arguing:
 *   bold  — headline-led, the safest at 256px
 *   rich  — closer to the reference ad, better when shown full size
 *
 * Run: node scripts/make-ad.mjs   (needs playwright resolvable from this package)
 */
import { chromium } from 'playwright';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const out = join(root, '_assets', '07-ads');
mkdirSync(out, { recursive: true });

/* Inlined: setContent leaves the page on about:blank, and Chromium will not
   pull file:// subresources into that origin, so a linked font or logo simply
   does not arrive and the render silently falls back. */
/* Placeholders are brace-delimited because base64 has no braces. Bare tokens
   collide: the Rubik base64 happens to contain the sequence "CTA", so a later
   replace for the button label cut the font data in half and the face failed to
   decode, with nothing reported but text rendered in a fallback. */
const dataUri = (p, mime) => `data:${mime};base64,${readFileSync(p).toString('base64')}`;
const fontDir = join(root, 'node_modules/@fontsource-variable/rubik/files');
const fontFile = readdirSync(fontDir).find((f) => f === 'rubik-hebrew-wght-normal.woff2');
if (!fontFile) throw new Error('upright Hebrew Rubik not found');
const FONT = dataUri(join(fontDir, fontFile), 'font/woff2');
const LOGO = dataUri(join(root, 'public/logo-white.webp'), 'image/webp');

const tpl = readFileSync(join(here, 'ad-chatgpt.html'), 'utf8');

const tick = `<svg viewBox="0 0 20 20" fill="none"><path d="m5 10.4 3 3 7-7.2" stroke="#CDE0F8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const chip = (t) => `<span class="chip"><i>${tick}</i>${t}</span>`;

const GOOGLE = `<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09Z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"/></svg>`;
const META = `<svg viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07Z"/></svg>`;

const VARIANTS = [
  {
    name: 'bold',
    /* Nothing competes with the line. This is the one to run. */
    headline: 'רוצים לפרסם<br><span>בתוך ChatGPT?</span>',
    size: '104px',
    sub: 'הפלטפורמה נפתחה למפרסמים בישראל.',
    chips: [],
    cta: 'לשיחת ייעוץ',
    marks: '',
  },
  {
    name: 'rich',
    /* Closer to the reference: more to read, better when shown full size. */
    headline: 'בעלי עסקים,<br><span>ChatGPT נפתח לפרסום.</span>',
    size: '78px',
    sub: 'הקמה, מעקב המרות וניהול שוטף. מיקוד לישראל.',
    chips: ['מיקוד לישראל', 'מעקב המרות', 'ניהול אישי'],
    cta: 'מתחילים',
    marks: GOOGLE + META,
  },
];

const b = await chromium.launch({ channel: 'chromium' });
const page = await b.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });

for (const v of VARIANTS) {
  const html = tpl
    .replace('{{FONT}}', FONT)
    .replace('{{LOGO}}', LOGO)
    .replace('{{INSIZE}}', v.size)
    .replace('{{HEADLINE}}', v.headline)
    .replace('{{SUB}}', v.sub)
    .replace('{{CHIPS}}', v.chips.map(chip).join(''))
    .replace('{{CTA}}', v.cta)
    .replace('{{MARKS}}', v.marks);

  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(350);

  const check = await page.evaluate(() => ({
    logo: (() => { const i = document.querySelector('.top img'); return i.complete && i.naturalWidth > 0; })(),
    rubik: document.fonts.check('800 100px Rubik'),
    overflows: document.querySelector('.wrap').scrollHeight > 1080,
  }));
  if (!check.logo) throw new Error(`${v.name}: logo did not load`);
  if (!check.rubik) throw new Error(`${v.name}: Rubik did not load`);
  if (check.overflows) throw new Error(`${v.name}: content taller than the frame`);

  const file = join(out, `chatgpt-${v.name}-1080.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
  console.log(`  ${v.name}: ${(readFileSync(file).length / 1024).toFixed(0)}KB  logo=ok font=ok fits=ok`);
}

/* The account logo is rendered at 32x32 next to the advertiser name, so it
   needs its own square file: the wordmark is 4.4:1 and turns to mush there. */
await page.setViewportSize({ width: 512, height: 512 });
await page.setContent(`<!doctype html><html><head><style>
  *{margin:0;padding:0}
  body{width:512px;height:512px;display:grid;place-items:center;background:#0B1424}
  img{width:390px;height:auto}
</style></head><body><img src="${LOGO}"></body></html>`, { waitUntil: 'networkidle' });
await page.waitForTimeout(200);
const logoFile = join(out, 'account-logo-512.png');
await page.screenshot({ path: logoFile, type: 'png' });
console.log(`  account logo: ${(readFileSync(logoFile).length / 1024).toFixed(0)}KB  512x512`);

await b.close();
