/**
 * Post templates. Every one renders on the same shell so the whole feed reads
 * as one system: navy ground, Rubik at weight 800, per-trade accent, logo and
 * domain in the same place every time.
 *
 * Layout is expressed in --u units (1 unit = canvas width / 1080) so a single
 * template survives feed, square, story and og without a second stylesheet.
 */
import { ink, brand, paper, win, verticals, site, sizes } from './brand.mjs';

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const accentOf = (v) => verticals[v]?.color ?? brand[300];
const labelOf = (v) => verticals[v]?.label ?? '';

/* ---------- shared pieces ---------- */

const phone = ({ src, muted = false, tag = '', scale = 1 }) => `
  <figure class="phone-wrap${muted ? ' is-muted' : ''}" style="--scale:${scale}">
    ${tag ? `<figcaption class="tag">${esc(tag)}</figcaption>` : ''}
    <div class="phone">
      <span class="island"></span>
      <div class="screen"><img src="${esc(src)}" alt=""></div>
    </div>
  </figure>`;

const footer = (logo) => `
  <footer class="foot">
    <img class="mark" src="${esc(logo)}" alt="">
    <span class="dom ltr">${site.domain}</span>
  </footer>`;

const head = ({ kicker, headline, sub }) => `
  ${kicker ? `<p class="kicker">${esc(kicker)}</p>` : ''}
  ${headline ? `<h1 class="display">${esc(headline)}</h1>` : ''}
  ${sub ? `<p class="sub">${esc(sub)}</p>` : ''}`;

/* ---------- templates ---------- */

/** The one that sells. Old site on the right (read first in RTL), new on the left. */
export const beforeAfter = (s) => `
  ${head({
    kicker: s.kicker ?? [labelOf(s.vertical), s.city].filter(Boolean).join(' · '),
    headline: s.headline,
    sub: s.sub,
  })}
  <div class="stage stage-pair">
    ${phone({ src: s.before, muted: true, tag: s.beforeTag ?? 'לפני', scale: 0.86 })}
    ${phone({ src: s.after, tag: s.afterTag ?? 'אחרי', scale: 1 })}
  </div>`;

/** One site, shown big. For catalogue posts where there is no "before". */
export const showcase = (s) => `
  ${head({
    kicker: s.kicker ?? [labelOf(s.vertical), s.city].filter(Boolean).join(' · '),
    headline: s.headline,
    sub: s.sub,
  })}
  <div class="stage stage-single">
    ${phone({ src: s.after ?? s.image, scale: 1 })}
    ${s.chips?.length ? `<ul class="chips">${s.chips.slice(0, 4).map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
  </div>`;

/** Proof. A number large enough to read at thumbnail size. */
export const stat = (s) => `
  ${head({ kicker: s.kicker, headline: null, sub: null })}
  <div class="stage stage-stat">
    <p class="figure"><span class="num ltr">${esc(s.value)}</span>${s.suffix ? `<span class="suf ltr">${esc(s.suffix)}</span>` : ''}</p>
    <p class="figure-label">${esc(s.label)}</p>
    ${s.sub ? `<p class="sub center">${esc(s.sub)}</p>` : ''}
    ${s.image ? `<div class="plate"><img src="${esc(s.image)}" alt=""></div>` : ''}
  </div>`;

/** Mistake of the week. Text carries it, so the type has to be beautiful. */
export const lesson = (s) => `
  <div class="stage stage-lesson">
    ${s.index ? `<span class="index">${esc(s.index)}</span>` : ''}
    ${s.kicker ? `<p class="kicker">${esc(s.kicker)}</p>` : ''}
    <h1 class="display lg">${esc(s.headline)}</h1>
    ${s.body ? `<p class="body">${esc(s.body)}</p>` : ''}
    ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}
  </div>`;

/** The direct-response one. Price on the graphic, on purpose. */
export const offer = (s) => `
  ${head({ kicker: s.kicker, headline: s.headline, sub: s.sub })}
  <div class="stage stage-offer">
    <div class="prices">
      ${(s.prices ?? []).map((p) => `
        <div class="price${p.strong ? ' is-strong' : ''}">
          <span class="amt ltr">${esc(p.amount)}</span>
          <span class="cap">${esc(p.caption)}</span>
        </div>`).join('')}
    </div>
    ${s.bullets?.length ? `<ul class="bullets">${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
    ${s.cta ? `<p class="cta">${esc(s.cta)}</p>` : ''}
  </div>`;

export const templates = { beforeAfter, showcase, stat, lesson, offer };

/* ---------- shell ---------- */

export function page(spec, { fontCss, logo, size = 'feed' }) {
  const build = templates[spec.template];
  if (!build) throw new Error(`unknown template: ${spec.template}`);

  const { w, h } = sizes[size] ?? sizes.feed;
  const accent = spec.accent ?? accentOf(spec.vertical);
  const light = spec.theme === 'light';

  return `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8">
<style>
${fontCss}

:root {
  --u: ${(w / 1080).toFixed(4)};
  --accent: ${accent};
  --ground: ${light ? paper : ink[900]};
  --fg: ${light ? ink[900] : '#FFFFFF'};
  --dim: ${light ? ink[500] : ink[300]};
  --line: ${light ? 'rgba(11,20,36,.10)' : 'rgba(255,255,255,.10)'};
  --card: ${light ? '#FFFFFF' : ink[850]};
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${w}px; height: ${h}px; overflow: hidden; }
body {
  font-family: "Rubik", system-ui, sans-serif;
  font-synthesis-weight: none;
  -webkit-font-smoothing: antialiased;
  background: var(--ground);
  color: var(--fg);
}
.canvas {
  position: relative; width: ${w}px; height: ${h}px;
  display: flex; flex-direction: column;
  padding: calc(var(--u) * 88px) calc(var(--u) * 76px) calc(var(--u) * 64px);
  isolation: isolate; overflow: hidden;
}
/* One accent wash, placed behind the content, so the ground is never flat navy */
.glow {
  position: absolute; z-index: -1; inset: auto -20% -30% -20%;
  height: 70%;
  background: radial-gradient(50% 60% at 50% 100%, color-mix(in srgb, var(--accent) 34%, transparent), transparent 72%);
  opacity: ${light ? 0.5 : 0.85};
}
.rule { position: absolute; z-index: -1; inset: 0 0 auto 0; height: calc(var(--u) * 8px); background: var(--accent); }

/* type */
.kicker {
  font-size: calc(var(--u) * 30px); font-weight: 600; letter-spacing: .02em;
  color: var(--accent); margin-bottom: calc(var(--u) * 22px);
}
.display {
  font-size: calc(var(--u) * 86px); font-weight: 800;
  letter-spacing: -0.025em; line-height: 1.04; text-wrap: balance;
}
.display.lg { font-size: calc(var(--u) * 108px); }
.sub {
  margin-top: calc(var(--u) * 26px); font-size: calc(var(--u) * 34px);
  font-weight: 400; line-height: 1.55; color: var(--dim); max-width: 88%; text-wrap: pretty;
}
.sub.center { max-width: 100%; text-align: center; }
.body { margin-top: calc(var(--u) * 34px); font-size: calc(var(--u) * 42px); line-height: 1.55; color: var(--dim); }
.note { margin-top: calc(var(--u) * 40px); font-size: calc(var(--u) * 30px); color: var(--accent); font-weight: 600; }
.ltr { direction: ltr; unicode-bidi: isolate; }

/* stage */
.stage { flex: 1 1 0; min-height: 0; height: 0; display: flex; margin-top: calc(var(--u) * 40px); }
.stage-pair { align-items: flex-end; justify-content: center; gap: calc(var(--u) * 40px); }
.stage-single { flex-direction: column; align-items: center; justify-content: flex-end; gap: calc(var(--u) * 40px); }
.stage-stat { flex-direction: column; align-items: center; justify-content: center; gap: calc(var(--u) * 16px); }
.stage-lesson { flex-direction: column; justify-content: center; margin-top: 0; }
.stage-offer { flex-direction: column; justify-content: center; gap: calc(var(--u) * 40px); }

/* phone */
.phone-wrap { height: 100%; min-height: 0; display: grid; grid-template-rows: auto minmax(0, 1fr);
  justify-items: center; gap: calc(var(--u) * 22px); }
.phone-wrap.is-muted { opacity: .78; }
.phone-wrap.is-muted .screen img { filter: grayscale(1) contrast(.88) brightness(.95); }
.tag {
  font-size: calc(var(--u) * 26px); font-weight: 700; letter-spacing: .04em;
  padding: calc(var(--u) * 8px) calc(var(--u) * 22px); border-radius: 999px;
  background: var(--card); color: var(--fg); border: 1px solid var(--line);
}
.phone-wrap:not(.is-muted) .tag { background: var(--accent); color: #fff; border-color: transparent; }
.phone {
  position: relative; align-self: end; height: calc(100% * var(--scale)); aspect-ratio: 9 / 19;
  border-radius: calc(var(--u) * 44px); padding: calc(var(--u) * 10px);
  background: #07080B;
  box-shadow: 0 calc(var(--u)*48px) calc(var(--u)*90px) calc(var(--u)*-24px) rgba(0,0,0,.6),
              inset 0 0 0 1px rgba(255,255,255,.14);
}
.island {
  position: absolute; z-index: 2; top: calc(var(--u) * 24px); left: 50%; transform: translateX(-50%);
  width: calc(var(--u) * 96px); height: calc(var(--u) * 26px); border-radius: 999px; background: #07080B;
}
.screen { height: 100%; border-radius: calc(var(--u) * 36px); overflow: hidden; background: #fff; }
.screen img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top center; }

/* chips */
.chips { display: flex; flex-wrap: wrap; gap: calc(var(--u) * 14px); justify-content: center; list-style: none; }
.chips li {
  font-size: calc(var(--u) * 27px); font-weight: 500; color: var(--fg);
  padding: calc(var(--u) * 12px) calc(var(--u) * 26px);
  border: 1px solid var(--line); border-radius: 999px; background: var(--card);
}

/* stat */
.figure { display: flex; direction: ltr; align-items: baseline; gap: calc(var(--u) * 6px); font-weight: 800; letter-spacing: -0.04em; }
.num { font-size: calc(var(--u) * 300px); line-height: .9; color: var(--accent); }
.suf { font-size: calc(var(--u) * 130px); color: var(--accent); }
.figure-label { font-size: calc(var(--u) * 44px); font-weight: 700; text-align: center; }
.plate { margin-top: calc(var(--u) * 40px); width: 78%; border-radius: calc(var(--u) * 24px); overflow: hidden; border: 1px solid var(--line); }
.plate img { display: block; width: 100%; }

/* lesson */
.index {
  font-size: calc(var(--u) * 40px); font-weight: 800; color: var(--accent);
  letter-spacing: .1em; margin-bottom: calc(var(--u) * 28px);
}

/* offer */
.prices { display: flex; gap: calc(var(--u) * 24px); }
.price {
  flex: 1; padding: calc(var(--u) * 32px); border-radius: calc(var(--u) * 24px);
  background: var(--card); border: 1px solid var(--line);
  display: flex; flex-direction: column; gap: calc(var(--u) * 8px);
}
.price.is-strong { background: var(--accent); border-color: transparent; }
.price.is-strong .cap { color: rgba(255,255,255,.86); }
.amt { font-size: calc(var(--u) * 78px); font-weight: 800; letter-spacing: -0.03em; }
.cap { font-size: calc(var(--u) * 28px); color: var(--dim); font-weight: 500; }
.bullets { list-style: none; display: flex; flex-direction: column; gap: calc(var(--u) * 16px); }
.bullets li { font-size: calc(var(--u) * 33px); color: var(--dim); padding-inline-start: calc(var(--u) * 34px); position: relative; }
.bullets li::before {
  content: ""; position: absolute; inset-inline-start: 0; top: calc(var(--u) * 16px);
  width: calc(var(--u) * 14px); height: calc(var(--u) * 14px); border-radius: 999px; background: var(--accent);
}
.cta { font-size: calc(var(--u) * 38px); font-weight: 700; color: var(--fg); }

/* footer */
.foot { display: flex; align-items: center; justify-content: space-between; margin-top: calc(var(--u) * 44px); }
.mark { height: calc(var(--u) * 44px); width: auto; }
.dom { font-size: calc(var(--u) * 27px); font-weight: 500; color: var(--dim); letter-spacing: .01em; }
</style></head>
<body><div class="canvas">
<span class="rule"></span><span class="glow"></span>
${build(spec)}
${footer(logo)}
</div></body></html>`;
}
