/**
 * Capture a client site into the four shapes the portfolio uses.
 *
 * Client sites are WordPress builds full of scroll-reveal animation. Captured
 * naively, every element below the fold is photographed mid-fade at whatever
 * opacity it happened to hold, so the shot comes out half-empty. Everything is
 * forced to its settled state before a pixel is taken.
 *
 * Run: node scripts/capture-site.mjs <slug> <url>
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [slug, url] = process.argv.slice(2);
if (!slug || !url) throw new Error('usage: capture-site.mjs <slug> <url>');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dirs = ['sites', 'phones', 'tiles'].map((d) => join(root, 'public/images', d));
dirs.forEach((d) => mkdirSync(d, { recursive: true }));

/* Reveal libraries park elements at opacity 0 until the viewport reaches them,
   and a full-page screenshot does not trigger that. Animations are killed
   outright rather than waited on: waiting is a guess, this is not. */
const SETTLE = `
  *,*::before,*::after{animation:none !important;transition:none !important}
  [data-aos],.elementor-invisible,.animated,.wow,.fade-in,.reveal,
  [class*="animate"],[data-animation]{
    opacity:1 !important;transform:none !important;visibility:visible !important}
  /* An unloaded map iframe is a black rectangle in the middle of the shot. */
  iframe{background:#eef2f6 !important}
  html{scroll-behavior:auto !important}
`;

/* A plain automation UA gets a 403 from several of these hosts. */
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';

const b = await chromium.launch({
  channel: 'chromium',
  args: ['--disable-blink-features=AutomationControlled'],
});

async function shoot({ width, height, out, full, scale = 2 }) {
  const p = await b.newPage({
    viewport: { width, height },
    deviceScaleFactor: scale,
    userAgent: UA,
  });
  /* networkidle never arrives on sites with chat widgets, pixels and ad tags
     that hold connections open; 'load' does, and the scroll pass below is what
     actually guarantees the images are in. */
  await p.goto(url, { waitUntil: 'load', timeout: 60_000 });
  await p.addStyleTag({ content: SETTLE });
  /* Walk the page so lazy images actually request, then return to the top. */
  await p.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
    await Promise.all(
      [...document.images].filter((i) => !i.complete).map((i) =>
        /* A broken or blocked image would otherwise hang this forever. */
        Promise.race([
          new Promise((r) => { i.onload = i.onerror = r; }),
          new Promise((r) => setTimeout(r, 4000)),
        ]),
      ),
    );
  });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: out, fullPage: full, type: 'png' });
  const h = await p.evaluate(() => document.body.scrollHeight);
  await p.close();
  return h;
}

const tmp = join(root, '_assets', 'capture');
mkdirSync(tmp, { recursive: true });

const deskRaw = join(tmp, `${slug}-desktop-raw.png`);
const mobRaw = join(tmp, `${slug}-mobile-raw.png`);
console.log(`  capturing ${url}`);
const dh = await shoot({ width: 1440, height: 900, out: deskRaw, full: true, scale: 1 });
const mh = await shoot({ width: 390, height: 844, out: mobRaw, full: true, scale: 2 });
console.log(`  desktop page height ${dh}px, mobile ${mh}px`);
await b.close();

/* The raw shots stay full size here; scripts/resize-capture.py converts them to
   the exact dimensions the portfolio components already expect. */
console.log(`  raw shots written to ${tmp}`);
