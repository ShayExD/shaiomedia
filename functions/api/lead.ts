/**
 * Cloudflare Pages Function - POST /api/lead
 *
 * Delivers a lead to email and, if configured, to an external CRM webhook.
 *
 * Environment variables (Pages -> Settings -> Variables and Secrets):
 *   LEAD_TO            required  where leads land, e.g. contact@shaiomedia.com
 *   LEAD_FROM          required  verified sender on a domain you control
 *   ALLOWED_ORIGIN     required  e.g. https://service.shaiomedia.com
 *   RESEND_API_KEY     optional  send via Resend instead of MailChannels
 *   TURNSTILE_SECRET   optional  if set, a valid Turnstile token is required
 *   CRM_WEBHOOK_URL    optional  receives the raw JSON lead
 *   CRM_WEBHOOK_TOKEN  optional  sent as Authorization: Bearer <token>
 */

interface Env {
  LEAD_TO: string;
  LEAD_FROM: string;
  ALLOWED_ORIGIN?: string;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET?: string;
  CRM_WEBHOOK_URL?: string;
  CRM_WEBHOOK_TOKEN?: string;
}

type Lead = Record<string, unknown>;

/** Hard caps. Without these one request can carry megabytes into an email. */
const LIMITS = { body: 8 * 1024, name: 80, email: 160, phone: 32, service: 60, message: 1500 };

/** Anything off this list is recorded generically rather than echoed back. */
const SERVICES = new Set([
  "×× ××× ××©××¤××¦××",
  "××××ª",
  "××¨××××ª",
  "×× ×¢××× ××ª",
  "×××ª××ª ××¨×××³",
  "×¢×¡×§ ×©××¨××ª ×××¨",
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const esc = (s = "") =>
  s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Strip control characters, so nothing header-shaped can carry CR or LF. */
const CTRL = new RegExp("[\u0000-\u001F\u007F]+", "g");
const clean = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(CTRL, " ").trim().slice(0, max) : "";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // 1. Only accept the form from our own origin, so a script elsewhere cannot
  //    simply POST in a loop and flood the inbox.
  const allowed = env.ALLOWED_ORIGIN;
  if (allowed) {
    const origin = request.headers.get("origin");
    if (origin && origin !== allowed) return json({ error: "bad_origin" }, 403);
  }

  // 2. Refuse oversized bodies before parsing them.
  if (Number(request.headers.get("content-length") ?? 0) > LIMITS.body) {
    return json({ error: "too_large" }, 413);
  }
  const raw = await request.text();
  if (raw.length > LIMITS.body) return json({ error: "too_large" }, 413);

  let lead: Lead;
  try {
    lead = JSON.parse(raw);
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  if (typeof lead !== "object" || lead === null) return json({ error: "bad_json" }, 400);

  // 3. Honeypot. Answer 200 so a bot learns nothing from the response.
  if (clean(lead.company_website, 200)) return json({ ok: true });

  const name = clean(lead.name, LIMITS.name);
  const email = clean(lead.email, LIMITS.email);
  const phone = clean(lead.phone, LIMITS.phone);
  const message = clean(lead.message, LIMITS.message);
  const rawService = clean(lead.service, LIMITS.service);
  const service = SERVICES.has(rawService) ? rawService : rawService ? "אחר" : "";

  if (name.length < 2) return json({ error: "invalid_name" }, 422);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: "invalid_email" }, 422);
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return json({ error: "invalid_phone" }, 422);

  // 4. Turnstile when configured. This is the real bot defence; a honeypot
  //    alone only stops untargeted scrapers.
  if (env.TURNSTILE_SECRET) {
    const token = clean(lead["cf-turnstile-response"], 2048);
    if (!token) return json({ error: "captcha_missing" }, 400);
    try {
      const v = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET,
          response: token,
          remoteip: request.headers.get("cf-connecting-ip") ?? undefined,
        }),
      });
      const out = (await v.json()) as { success?: boolean };
      if (!out.success) return json({ error: "captcha_failed" }, 403);
    } catch {
      return json({ error: "captcha_unavailable" }, 503);
    }
  }

  const payload = {
    name, phone, email, service, message,
    source: new URL(request.url).host,
    receivedAt: new Date().toISOString(),
    ip: request.headers.get("cf-connecting-ip") ?? "",
    country: (request as { cf?: { country?: string } }).cf?.country ?? "",
    userAgent: clean(request.headers.get("user-agent"), 300),
    referer: clean(request.headers.get("referer"), 300),
  };

  const rows: [string, string][] = [
    ["שם", payload.name],
    ["טלפון", payload.phone],
    ["אימייל", payload.email],
    ["שירות", payload.service || "-"],
    ["הודעה", payload.message || "-"],
    ["מקור", payload.referer || "ישיר"],
    ["התקבל", payload.receivedAt],
  ];

  const html = `<div dir="rtl" style="font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;line-height:1.6">
<h2 style="margin:0 0 12px">ליד חדש מהאתר</h2>
<table cellpadding="7" style="border-collapse:collapse;font-size:15px">
${rows.map(([k, v]) => `<tr><td style="border:1px solid #e5e5ef;background:#fafaff;font-weight:600">${esc(k)}</td><td style="border:1px solid #e5e5ef">${esc(v)}</td></tr>`).join("")}
</table></div>`;

  // Already control-stripped, so this cannot carry a newline into a header.
  const subject = `ליד חדש: ${name}${service ? ` - ${service}` : ""}`;

  let emailOk = false;
  try {
    if (env.RESEND_API_KEY) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ from: env.LEAD_FROM, to: [env.LEAD_TO], reply_to: email, subject, html }),
      });
      emailOk = r.ok;
    } else {
      const r = await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: env.LEAD_TO }] }],
          from: { email: env.LEAD_FROM, name: "shaiomedia" },
          reply_to: { email, name },
          subject,
          content: [{ type: "text/html", value: html }],
        }),
      });
      emailOk = r.ok;
    }
  } catch {
    emailOk = false;
  }

  let crmOk: boolean | null = null;
  if (env.CRM_WEBHOOK_URL) {
    try {
      const r = await fetch(env.CRM_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(env.CRM_WEBHOOK_TOKEN ? { authorization: `Bearer ${env.CRM_WEBHOOK_TOKEN}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      crmOk = r.ok;
    } catch {
      crmOk = false;
    }
  }

  if (!emailOk && crmOk !== true) return json({ error: "delivery_failed" }, 502);
  return json({ ok: true });
};
