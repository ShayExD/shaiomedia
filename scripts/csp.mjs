/**
 * Post-build: pin every inline <script> and <style> in the output with a
 * sha256 hash and write a Content-Security-Policy into dist/_headers.
 *
 * Doing it here rather than by hand means the policy can never drift from what
 * actually shipped, and script-src never needs 'unsafe-inline'.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, statSync, appendFileSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

const sha = (s) => "'sha256-" + createHash("sha256").update(s, "utf8").digest("base64") + "'";

const scripts = new Set();
const styles = new Set();

for (const file of walk(DIST)) {
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (m[1].length) scripts.add(sha(m[1]));
  }
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    if (m[1].length) styles.add(sha(m[1]));
  }
}

// Turnstile, when enabled, needs its script and its challenge iframe allowed.
const TS = process.env.PUBLIC_TURNSTILE_KEY ? " https://challenges.cloudflare.com" : "";

const policy = [
  "default-src 'self'",
  `script-src 'self'${TS} ${[...scripts].join(" ")}`.trim(),
  `style-src 'self' ${[...styles].join(" ")}`.trim(),
  // Inline style attributes cannot execute script; Tailwind uses them heavily.
  "style-src-attr 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${TS}`.trim(),
  "form-action 'self'",
  `frame-src 'self'${TS}`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const headers = join(DIST, "_headers");
let text = readFileSync(headers, "utf8");
text = text.replace(
  /^(\/\*\n)/m,
  `$1  Content-Security-Policy: ${policy}\n`,
);
writeFileSync(headers, text);

console.log(`csp: pinned ${scripts.size} inline script(s), ${styles.size} inline style(s)`);
