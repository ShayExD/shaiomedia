/**
 * Contract tests for the campaign hero backdrops.
 *
 * Two different guarantees apply either side of the gutter breakpoint, and the
 * distinction is the whole design:
 *
 *   >= 1360px  there is room beside the headline column, so everything runs in
 *              a clipped gutter and must never touch the copy at all.
 *   <  1360px  there is no such room. The run crosses behind the copy on
 *              purpose, so overlap is expected and what must hold instead is
 *              the headline's measured contrast against what is painted behind
 *              it, plus coverage of most of the hero's height — the earlier
 *              version only reached halfway and read as a bottom-edge effect.
 *
 * Motion is proven by sampling position over time. getComputedStyle reports
 * animation-play-state "running" for an animation whose shorthand was
 * invalidated and which is not moving at all, so it can never be the evidence.
 *
 * Needs playwright resolvable from this package. Run:
 *   node scripts/verify-hero.mjs [origin]
 */
import { chromium } from 'playwright';

const BASE = (process.argv[2] ?? process.env.VERIFY_URL ?? 'https://service.shaiomedia.com').replace(/\/$/, '');
const GUTTER_BREAKPOINT = 1360;
const WIDTHS = [[360, 780], [390, 844], [768, 1024], [1024, 800], [1360, 900], [1440, 900], [1920, 1080]];
const MIN_CONTRAST = 4.5;
const MIN_COVERAGE = 0.65; // fraction of hero height the run must reach into

let pass = 0;
const failures = [];
const check = (name, ok, detail = '') => {
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL ${name} — ${detail}`); }
};

const srgb = (v) => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);

/** Contrast from pixels actually painted, never from walking ancestor styles:
 *  the hero's ground is a separate absolutely positioned layer, so an ancestor
 *  walk finds `transparent` and reports a ratio that is not what anyone sees. */
function contrastOf(png) {
  const ls = [];
  for (let i = 0; i < png.length; i += 4) ls.push(lum([png[i], png[i + 1], png[i + 2]]));
  ls.sort((a, b) => a - b);
  const ink = ls.slice(-Math.ceil(ls.length / 12));
  const ground = ls.slice(0, Math.ceil(ls.length / 3));
  const avg = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  return (avg(ink) + 0.05) / (avg(ground) + 0.05);
}

const browser = await chromium.launch();
console.log(`\nVerifying hero motion on ${BASE}\n`);

for (const [w, h] of WIDTHS) {
  const gutterMode = w >= GUTTER_BREAKPOINT;
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));

  for (const slug of ['meta', 'google-ads']) {
    await page.goto(`${BASE}/${slug}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1100);

    const overlaps = new Set();
    let minTop = Infinity, maxBottom = -Infinity, emptyFrames = 0, clipped = 0;
    const positions = [];

    for (let i = 0; i < 36; i++) {
      const r = await page.evaluate(() => {
        const hero = document.querySelector('main section').getBoundingClientRect();
        const texts = [...document.querySelectorAll('main section h1, main section p, main section a')]
          .filter((el) => !el.closest('.hb') && el.textContent.trim() && el.getBoundingClientRect().height > 0);
        const vis = [...document.querySelectorAll('.hb-card,.hb-chip,.hb-react')]
          .filter((el) => getComputedStyle(el).display !== 'none' && +getComputedStyle(el).opacity > 0.12);
        let top = Infinity, bottom = -Infinity, cut = 0;
        const hits = [];
        vis.forEach((el) => {
          const q = el.getBoundingClientRect();
          top = Math.min(top, (q.top - hero.top) / hero.height);
          bottom = Math.max(bottom, (q.bottom - hero.top) / hero.height);
          const g = el.parentElement.getBoundingClientRect();
          if (q.width > 0 && (q.left < g.left - 1 || q.right > g.right + 1)) cut++;
          texts.forEach((t) => {
            const z = t.getBoundingClientRect();
            if (Math.min(q.right, z.right) - Math.max(q.left, z.left) > 2 &&
                Math.min(q.bottom, z.bottom) - Math.max(q.top, z.top) > 2)
              hits.push(t.textContent.trim().slice(0, 14));
          });
        });
        const first = document.querySelector('.hb-card,.hb-chip');
        return { hits, cut, n: vis.length, top, bottom, y: first ? Math.round(first.getBoundingClientRect().top) : null };
      });
      r.hits.forEach((x) => overlaps.add(x));
      clipped += r.cut;
      if (r.n === 0) emptyFrames++;
      else { minTop = Math.min(minTop, r.top); maxBottom = Math.max(maxBottom, r.bottom); }
      if (r.y !== null) positions.push(r.y);
      await page.waitForTimeout(110);
    }

    const label = `${w}px ${slug}`;
    check(`${label}: something is always on screen`, emptyFrames === 0, `${emptyFrames}/36 empty`);
    check(`${label}: the run is actually moving`, new Set(positions).size > 3, `${new Set(positions).size} distinct positions`);
    check(`${label}: nothing is clipped by its gutter`, clipped === 0, `${clipped} clipped`);
    check(`${label}: no horizontal overflow`,
      (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) === 0);
    check(`${label}: no console errors`, errs.length === 0, errs.slice(0, 2).join(' | '));

    if (gutterMode) {
      check(`${label}: gutter keeps the run off the copy entirely`, overlaps.size === 0, [...overlaps].join('|'));
    } else {
      const covered = 1 - minTop;
      check(`${label}: the run covers most of the hero, not just its base`,
        covered >= MIN_COVERAGE, `reached ${(covered * 100).toFixed(0)}% of hero height`);
      const shot = await (await page.$('h1')).screenshot();
      const { data, info } = await decode(shot);
      const ratio = contrastOf(data);
      check(`${label}: headline stays legible where the run crosses it`,
        ratio >= MIN_CONTRAST, `${ratio.toFixed(1)}:1 measured over ${info.width}x${info.height}`);
    }
  }
  await page.close();
}
await browser.close();

console.log(`\n${pass} passed, ${failures.length} failed\n`);
if (failures.length) { failures.forEach((f) => console.log(`  - ${f}`)); process.exit(1); }

/** Minimal PNG reader: enough to get RGBA pixels without another dependency. */
async function decode(buf) {
  /* A screenshot arrives as PNG. Inflate it with zlib rather than adding an
     image dependency for what is a few hundred lines of pixels. */
  const zlib = await import('node:zlib');
  let pos = 8, width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`unsupported colour type ${colorType}`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(width * height * 4);
  const line = Buffer.alloc(stride);
  const prev = Buffer.alloc(stride);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    raw.copy(line, 0, p, p + stride); p += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? line[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[i] = v & 0xff;
    }
    line.copy(prev);
    for (let x = 0; x < width; x++) {
      const s = x * channels;
      const d = (y * width + x) * 4;
      out[d] = line[s];
      out[d + 1] = channels >= 3 ? line[s + 1] : line[s];
      out[d + 2] = channels >= 3 ? line[s + 2] : line[s];
      out[d + 3] = 255;
    }
  }
  return { data: out, info: { width, height } };
}
