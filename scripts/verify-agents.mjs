/**
 * Contract tests for the machine-readable surface.
 *
 * Every assertion here is a behaviour an agent depends on and that nothing in
 * the visual build would catch if it broke: a middleware edit that drops Vary,
 * a renamed page that orphans llms.txt, a 404 that starts answering 200.
 *
 * Run against the live origin (default) or a local `wrangler pages dev`:
 *   node scripts/verify-agents.mjs
 *   node scripts/verify-agents.mjs http://localhost:8788
 */
const BASE = (process.argv[2] ?? process.env.VERIFY_URL ?? 'https://service.shaiomedia.com')
  .replace(/\/$/, '');

const PAGES = ['/', '/meta', '/google-ads', '/about', '/privacy-policy', '/accessibility-statement'];
const BROWSER_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';

let pass = 0;
const failures = [];

function check(name, ok, detail = '') {
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
}

const get = (path, headers = {}) =>
  fetch(BASE + path, { headers, redirect: 'manual' });

const varyHasAccept = (res) =>
  (res.headers.get('vary') ?? '').toLowerCase().split(',').map((s) => s.trim()).includes('accept');

console.log(`\nVerifying ${BASE}\n`);

/* ---- 1. Agent-friendly 404 -------------------------------------------- */
{
  const res = await get('/a-path-that-does-not-exist-' + 'x'.repeat(8));
  check('404: nonexistent path returns 404', res.status === 404, `got ${res.status}`);
  const body = await res.text();
  const type = res.headers.get('content-type') ?? '';
  check('404: body is markdown for a non-browser client', type.includes('text/markdown'), `got "${type}"`);
  check('404: body points at llms.txt', body.includes('/llms.txt'));
  check('404: body points at the sitemap', body.includes('sitemap-index.xml'));
  check('404: body links the real pages', PAGES.slice(1).every((p) => body.includes(p)));

  const html = await get('/another-missing-path', { Accept: BROWSER_ACCEPT });
  const htmlBody = await html.text();
  check('404: a browser still gets the designed HTML page', html.status === 404 && (html.headers.get('content-type') ?? '').includes('text/html'), `got ${html.status} ${html.headers.get('content-type')}`);
  check('404: the HTML page also lists the recovery links', htmlBody.includes('/llms.txt') && htmlBody.includes('sitemap-index.xml'));
}

/* ---- 2. Markdown content negotiation ---------------------------------- */
for (const path of PAGES) {
  const res = await get(path, { Accept: 'text/markdown' });
  const type = (res.headers.get('content-type') ?? '').toLowerCase();
  check(`md: ${path} serves text/markdown`, res.status === 200 && type.startsWith('text/markdown'), `got ${res.status} "${type}"`);
  check(`md: ${path} sets Vary: Accept`, varyHasAccept(res), `got "${res.headers.get('vary')}"`);
  const body = await res.text();
  check(`md: ${path} has a heading and no raw HTML tags`, /^#|\n#/.test(body) && !/<(div|section|span)\b/i.test(body));
}

for (const path of PAGES) {
  const res = await get(path, { Accept: BROWSER_ACCEPT });
  const type = (res.headers.get('content-type') ?? '').toLowerCase();
  check(`html: ${path} still serves HTML to a browser`, res.status === 200 && type.startsWith('text/html'), `got ${res.status} "${type}"`);
  check(`html: ${path} sets Vary: Accept`, varyHasAccept(res), `got "${res.headers.get('vary')}"`);
}

{
  const res = await get('/meta.md');
  const type = (res.headers.get('content-type') ?? '').toLowerCase();
  check('md: the explicit .md path works', res.status === 200 && type.startsWith('text/markdown'), `got ${res.status} "${type}"`);
}

/* ---- 3. Agent instruction file ---------------------------------------- */
{
  const res = await get('/llms.txt');
  const body = await res.text();
  check('llms.txt: served', res.status === 200, `got ${res.status}`);
  check('llms.txt: has a when-to-use section', /##\s*When to use this/i.test(body));
  check('llms.txt: has a when-NOT-to-use section', /##\s*When not to use this/i.test(body));
  check('llms.txt: names concrete jobs, not slogans', /roofing/i.test(body) && /Google Ads/i.test(body));
  check('llms.txt: says how to make contact', body.includes('contact@shaiomedia.com'));
  check('llms.txt: links every page', PAGES.slice(1).every((p) => body.includes(p)));
  check('llms.txt: documents the markdown route', /Accept: text\/markdown/i.test(body));
}

/* ---- 4. Trust anchors -------------------------------------------------- */
for (const [path, label] of [['/about', 'about'], ['/privacy-policy', 'privacy']]) {
  const res = await get(path, { Accept: BROWSER_ACCEPT });
  const body = await res.text();
  const text = body.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  check(`trust: ${label} page exists`, res.status === 200, `got ${res.status}`);
  check(`trust: ${label} page has over 500 characters of prose`, text.length > 500, `${text.length} chars`);
}
{
  const home = await (await get('/', { Accept: BROWSER_ACCEPT })).text();
  check('trust: the about page is reachable from the homepage', home.includes('href="/about"'));
}

/* ---- 5. JSON-LD identity ---------------------------------------------- */
{
  const body = await (await get('/', { Accept: BROWSER_ACCEPT })).text();
  const blocks = [...body.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  check('json-ld: present on the homepage', blocks.length > 0);
  let graph = [];
  try {
    for (const b of blocks) {
      const parsed = JSON.parse(b[1]);
      graph = graph.concat(parsed['@graph'] ?? [parsed]);
    }
    check('json-ld: parses', true);
  } catch (e) {
    check('json-ld: parses', false, String(e));
  }
  const org = graph.find((n) => n['@type'] === 'ProfessionalService');
  check('json-ld: has an organisation node', !!org);
  for (const field of ['name', 'description', 'url', 'sameAs', 'logo', 'email']) {
    check(`json-ld: organisation has ${field}`, !!org?.[field]);
  }
  const people = (org?.founder ?? []).filter((p) => p['@type'] === 'Person');
  check('json-ld: founders listed', people.length > 0);
  check('json-ld: every Person has name, url and jobTitle',
    people.every((p) => p.name && p.url && p.jobTitle),
    JSON.stringify(people.map((p) => ({ name: !!p.name, url: !!p.url, jobTitle: !!p.jobTitle }))));
  const site = graph.find((n) => n['@type'] === 'WebSite');
  check('json-ld: WebSite node has url and description', !!site?.url && !!site?.description);
}

/* ---- Supporting files -------------------------------------------------- */
{
  const robots = await get('/robots.txt');
  const rb = await robots.text();
  check('robots.txt: served and names the sitemap', robots.status === 200 && rb.includes('sitemap-index.xml'));
  const sm = await get('/sitemap-index.xml');
  check('sitemap: served', sm.status === 200, `got ${sm.status}`);
  const smBody = await (await get('/sitemap-0.xml')).text();
  check('sitemap: lists the about page', smBody.includes('/about'));
}

/* ---- Regression guard: the lead endpoint is untouched ------------------ */
{
  const res = await fetch(BASE + '/api/lead', { method: 'GET' });
  check('api: /api/lead does not answer GET with a page', res.status !== 200, `got ${res.status}`);
}

console.log(`\n${pass} passed, ${failures.length} failed\n`);
if (failures.length) {
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
}
