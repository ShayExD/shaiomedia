import type { APIRoute } from "astro";

/** Generated so the sitemap URL always matches the origin this build targets. */
export const GET: APIRoute = ({ site }) => {
  const origin = (site?.origin ?? "https://service.shaiomedia.com").replace(/\/$/, "");
  const preview = process.env.PUBLIC_PREVIEW === "1";

  const body = preview
    ? `User-agent: *\nDisallow: /\n`
    : [
        "User-agent: *",
        "Allow: /",
        "",
        "# AI crawlers are welcome — being cited is distribution",
        ...["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "OAI-SearchBot"]
          .flatMap((ua) => [`User-agent: ${ua}`, "Allow: /"]),
        "",
        `Sitemap: ${origin}/sitemap-index.xml`,
        "",
      ].join("\n");

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
};
