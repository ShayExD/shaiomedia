/**
 * Markdown content negotiation, per acceptmarkdown.com.
 *
 * A page and its Markdown twin live at the same URL and are chosen by Accept.
 * The build writes /meta.html and /meta.md; this picks between them and, on
 * every negotiated response, sets `Vary: Accept`. Without that header a CDN
 * caches whichever variant it saw first and then serves HTML to an agent that
 * asked for Markdown, or the reverse — which is worse than not negotiating at
 * all, because it is intermittent and depends on who warmed the cache.
 *
 * A miss returns a real 404 with a Markdown body naming where to look next, so
 * an agent that guessed a URL can recover instead of stopping.
 */

interface Env {
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

const MD = "text/markdown";

/**
 * True when the client prefers Markdown over HTML.
 *
 * Browsers send `text/html,...;q=0.9,*\/*;q=0.8`, so a wildcard alone must not
 * count as a request for Markdown or every visitor would be served a text file.
 * Only an explicit text/markdown that outranks text/html wins.
 */
function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  let md = -1;
  let html = -1;
  for (const part of accept.split(",")) {
    const [type, ...params] = part.trim().split(";");
    const q = params.reduce((acc, p) => {
      const m = p.trim().match(/^q=([0-9.]+)$/i);
      return m ? Number(m[1]) : acc;
    }, 1);
    const t = type.trim().toLowerCase();
    if (t === MD || t === "text/x-markdown") md = Math.max(md, q);
    else if (t === "text/html" || t === "application/xhtml+xml") html = Math.max(html, q);
  }
  return md > 0 && md >= html;
}

/**
 * True when the client explicitly asked for HTML.
 *
 * A bare `*\/*` — what curl, most crawlers and most scripts send — is not a
 * request for HTML; it means "anything you have". For a 404 the Markdown
 * recovery body is the more useful thing to hand such a client, and browsers
 * are unaffected because they always name text/html outright.
 */
function acceptsHtml(accept: string | null): boolean {
  if (!accept) return false;
  return accept
    .split(",")
    .some((p) => /^\s*(text\/html|application\/xhtml\+xml)\b/i.test(p));
}

const withVary = (res: Response): Response => {
  const h = new Headers(res.headers);
  const existing = h.get("Vary");
  const parts = new Set(
    (existing ? existing.split(",") : []).map((s) => s.trim()).filter(Boolean),
  );
  parts.add("Accept");
  parts.add("Accept-Encoding");
  h.set("Vary", [...parts].join(", "));
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
};

const NOT_FOUND_MD = (origin: string, path: string) => `# 404 — Not found

\`${path}\` does not exist on this site.

## Where to look instead

- [Home](${origin}/) — websites and organic search for service businesses in the United States
- [Meta campaigns](${origin}/meta) — paid social management for businesses in Israel
- [Google Ads](${origin}/google-ads) — paid search management for businesses in Israel
- [About](${origin}/about) — who runs this company
- [Privacy policy](${origin}/privacy-policy)
- [Accessibility statement](${origin}/accessibility-statement)

## Machine-readable index

- Agent guide: ${origin}/llms.txt
- Sitemap: ${origin}/sitemap-index.xml
- Robots: ${origin}/robots.txt

Every page is available as Markdown: append \`.md\` to its path, or send
\`Accept: text/markdown\`.

Contact: contact@shaiomedia.com
`;

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next, env } = context;
  const url = new URL(request.url);

  /* The lead endpoint negotiates nothing and must not be touched. */
  if (url.pathname.startsWith("/api/")) return next();
  if (request.method !== "GET" && request.method !== "HEAD") return next();

  const wantsMd = prefersMarkdown(request.headers.get("Accept"));
  const isMdPath = url.pathname.endsWith(".md");

  /* An explicit .md path is a plain asset request; it only needs its type and
     Vary set, since the same URL is not negotiable. */
  if (isMdPath) {
    const res = await next();
    if (!res.ok) return withVary(await notFound(env, url, request));
    const h = new Headers(res.headers);
    h.set("Content-Type", `${MD}; charset=utf-8`);
    return withVary(new Response(res.body, { status: res.status, headers: h }));
  }

  if (wantsMd) {
    const base = url.pathname.replace(/\/$/, "");
    const target = new URL(url.toString());
    target.pathname = `${base === "" ? "/index" : base}.md`;
    const md = await env.ASSETS.fetch(new Request(target.toString(), { headers: request.headers }));
    if (md.ok) {
      const h = new Headers(md.headers);
      h.set("Content-Type", `${MD}; charset=utf-8`);
      h.set("X-Content-Variant", "markdown");
      return withVary(new Response(request.method === "HEAD" ? null : md.body, { status: 200, headers: h }));
    }
  }

  const res = await next();
  if (res.status === 404) return withVary(await notFound(env, url, request, wantsMd));
  return withVary(res);
};

/**
 * A 404 an agent can act on.
 *
 * Markdown when it was asked for, otherwise the designed HTML page — which
 * itself lists the same recovery links in its body, so a crawler that reads the
 * text of a plain GET still finds the sitemap and llms.txt.
 */
async function notFound(
  env: Env,
  url: URL,
  request: Request,
  wantsMd = false,
): Promise<Response> {
  const origin = url.origin;
  if (wantsMd || !acceptsHtml(request.headers.get("Accept"))) {
    return new Response(NOT_FOUND_MD(origin, url.pathname), {
      status: 404,
      headers: {
        "Content-Type": `${MD}; charset=utf-8`,
        "Cache-Control": "no-store",
        "X-Content-Variant": "markdown",
      },
    });
  }
  const page = await env.ASSETS.fetch(new URL("/404.html", origin).toString());
  return new Response(page.body, {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
