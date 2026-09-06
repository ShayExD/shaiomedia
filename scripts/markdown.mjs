/**
 * Emit a Markdown twin of every built page.
 *
 * Derived from the rendered HTML rather than written by hand, so the Markdown
 * cannot drift from what a person reads. Only <main> is converted: the header,
 * the footer and the decorative backdrops carry no information an agent needs,
 * and including them buries the page's actual content under navigation.
 *
 * Runs after astro build, before scripts/csp.mjs hashes anything, and touches
 * only files it creates.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = 'dist';

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  '#39': "'", '#8217': '’', '#8211': '–', '#8212': '—',
  '#8592': '←', laquo: '«', raquo: '»', hellip: '…',
};

const decode = (s) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
    const k = e.toLowerCase();
    if (ENTITIES[k] !== undefined) return ENTITIES[k];
    if (k.startsWith('#x')) return String.fromCodePoint(parseInt(k.slice(2), 16));
    if (k.startsWith('#')) return String.fromCodePoint(parseInt(k.slice(1), 10));
    return m;
  });

/** Drop a whole element, tag to matching close, nesting included. */
const dropElement = (html, tag) => {
  const open = new RegExp(`<${tag}\\b`, 'i');
  let out = html;
  for (;;) {
    const start = out.search(open);
    if (start === -1) return out;
    let i = start, depth = 0;
    const scan = new RegExp(`<(/?)${tag}\\b[^>]*?(/?)>`, 'gi');
    scan.lastIndex = start;
    let m, end = -1;
    while ((m = scan.exec(out))) {
      if (m[2] === '/') { if (m.index === start) { end = scan.lastIndex; break; } continue; }
      depth += m[1] === '/' ? -1 : 1;
      if (depth === 0) { end = scan.lastIndex; break; }
    }
    if (end === -1) return out.slice(0, start);
    out = out.slice(0, start) + out.slice(end);
    if (i === start && out.length === 0) return out;
  }
};

const inline = (html, origin) =>
  decode(
    html
      .replace(/<a\b[^>]*?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, text) => {
        const label = decode(text.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
        if (!label) return '';
        const url = href.startsWith('/') ? origin + href : href;
        return `[${label}](${url})`;
      })
      .replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, x) => `**${x.replace(/<[^>]+>/g, '').trim()}**`)
      .replace(/<br\s*\/?>/gi, ' ')
      /* Adjacent block-ish spans are separate words; stripping the tags with no
         separator glues the last word of one to the first of the next. */
      .replace(/<\/(span|div|p|li)>\s*<(span|div|p|li)\b/gi, '</$1> <$2')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/[ \t ]+/g, ' ')
    .trim();

function toMarkdown(html, origin) {
  let m = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  let body = m ? m[1] : html;

  for (const tag of ['script', 'style', 'svg', 'noscript', 'template', 'picture', 'form']) {
    body = dropElement(body, tag);
  }
  /* Decorative layers repeat the same words as the copy they sit behind. */
  body = body.replace(/<div\b[^>]*aria-hidden=["']true["'][\s\S]*?<\/div>/gi, ' ');

  const blocks = [];
  const re = /<(h1|h2|h3|h4|p|li|dt|dd|figcaption|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = re.exec(body))) {
    const tag = match[1].toLowerCase();
    const text = inline(match[2], origin);
    if (!text) continue;
    if (tag === 'h1') blocks.push(`# ${text}`);
    else if (tag === 'h2') blocks.push(`## ${text}`);
    else if (tag === 'h3') blocks.push(`### ${text}`);
    else if (tag === 'h4') blocks.push(`#### ${text}`);
    else if (tag === 'li') blocks.push(`- ${text}`);
    else if (tag === 'dt') blocks.push(`- **${text}**`);
    else if (tag === 'dd') blocks.push(`  ${text}`);
    else if (tag === 'blockquote') blocks.push(`> ${text}`);
    else blocks.push(text);
  }

  /* Consecutive identical lines come from responsive duplicates of one label. */
  const out = [];
  for (const b of blocks) if (b !== out[out.length - 1]) out.push(b);
  return out;
}

const meta = (html, name) => {
  const g = (re) => (html.match(re) || [, ''])[1];
  return {
    title: decode(g(/<title>([\s\S]*?)<\/title>/i)) || name,
    description: decode(g(/<meta name="description" content="([^"]*)"/i)),
    canonical: g(/<link rel="canonical" href="([^"]*)"/i),
  };
};

const origin = (process.env.SITE_URL ?? 'https://service.shaiomedia.com').replace(/\/$/, '');

const files = (await readdir(DIST)).filter((f) => f.endsWith('.html'));
let n = 0;
for (const file of files) {
  const name = file.replace(/\.html$/, '');
  const html = await readFile(join(DIST, file), 'utf8');
  const { title, description, canonical } = meta(html, name);
  const blocks = toMarkdown(html, origin);
  if (!blocks.length) {
    console.log(`  markdown: skipped ${file} (no content in <main>)`);
    continue;
  }

  const head = [
    `<!-- Markdown rendering of ${canonical || `${origin}/${name}`} -->`,
    '',
    description ? `> ${description}` : null,
    description ? '' : null,
  ].filter((x) => x !== null);

  const foot = [
    '',
    '---',
    '',
    `Canonical: ${canonical || `${origin}/${name === 'index' ? '' : name}`}`,
    `Agent guide: ${origin}/llms.txt`,
    `Sitemap: ${origin}/sitemap-index.xml`,
    '',
  ];

  /* The <title> already opens the file as the h1 when the page has none. */
  const hasH1 = blocks.some((b) => b.startsWith('# '));
  const parts = [...head, ...(hasH1 ? [] : [`# ${title}`, '']), ...blocks, ...foot];
  let doc = '';
  parts.forEach((b, i) => {
    const prev = parts[i - 1];
    /* Consecutive bullets belong to one list and must not be separated by a
       blank line, or every item renders as its own single-item list. */
    const tight = i > 0 && /^ *- /.test(b) && /^ *- /.test(prev ?? '');
    doc += (i === 0 ? '' : tight ? '\n' : '\n\n') + b;
  });
  doc = doc.replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '') + '\n';

  await writeFile(join(DIST, `${name}.md`), doc, 'utf8');
  n++;
}
console.log(`  markdown: wrote ${n} .md file(s)`);
