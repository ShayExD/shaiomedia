/**
 * Render one share card per campaign page.
 *
 * Without these both pages inherited the homepage card, so a link to the Google
 * page previewed in WhatsApp as "organic SEO in the US" — the wrong offer, in
 * the wrong country, to an Israeli reader.
 *
 * Run: node scripts/make-og.mjs
 *
 * playwright must resolve from this package. NODE_PATH does not work for ESM,
 * so install it or symlink it into node_modules before running.
 */
import { chromium } from 'playwright';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const fontDir = join(root, 'node_modules/@fontsource-variable/rubik/files');
const font = readdirSync(fontDir).find(f => f.includes('hebrew') && f.endsWith('.woff2'))
  || readdirSync(fontDir).find(f => f.endsWith('.woff2'));
/* Both assets are inlined as data URIs. setContent leaves the page on
   about:blank, and Chromium refuses to pull file:// subresources into that
   origin, so a linked font or logo silently does not arrive and the card
   renders in a fallback face with a gap where the mark should be. */
const dataUri = (path, mime) => `data:${mime};base64,${readFileSync(path).toString('base64')}`;
const fontUrl = dataUri(join(fontDir, font), 'font/woff2');
const logo = dataUri(join(root, 'public/logo-white.webp'), 'image/webp');
const tpl = readFileSync(join(here, 'og-campaign.html'), 'utf8');

const CARDS = [
  {
    out: 'meta.jpg',
    kicker: 'פייסבוק ואינסטגרם',
    headline: 'ניהול קמפיינים <span>שמביא פניות</span>',
    sub: 'לעסקים בישראל שחיים מפניות. מדברים עם מי שמנהל את החשבון, לא עם מתווך.',
    chips: [['889', 'פניות בחשבון אחד'], ['₪10.17', 'לפנייה'], ['שנה+', 'לקוחות שנשארים']],
  },
  {
    out: 'google-ads.jpg',
    kicker: 'Google Ads',
    headline: 'מי שמחפש עכשיו, <span>מגיע אליכם</span>',
    sub: 'ניהול קמפיינים בחיפוש לעסקים בישראל, עם מעקב המרות ואופטימיזציה שבועית.',
    chips: [['27.8K', 'קליקים'], ['₪0.48', 'לקליק'], ['10+', 'חודשי ניהול רצוף']],
  },
];

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });

for (const c of CARDS) {
  const html = tpl
    .replaceAll('FONT_400', fontUrl).replaceAll('FONT_700', fontUrl).replaceAll('FONT_800', fontUrl)
    .replace('LOGO_SRC', logo)
    .replace('KICKER', c.kicker)
    .replace('HEADLINE', c.headline)
    .replace('SUB', c.sub)
    .replace('CHIPS', c.chips.map(([v, l]) => `<div class="chip"><b>${v}</b><i>${l}</i></div>`).join(''));
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  const path = join(root, 'public/og', c.out);
  await p.screenshot({ path, type: 'jpeg', quality: 90, scale: 'css' });
  console.log(`  og/${c.out}  ${(readFileSync(path).length / 1024).toFixed(0)}KB`);
}
await b.close();
if (!existsSync(join(root, 'public/og/default.jpg'))) console.log('  note: default.jpg missing');
