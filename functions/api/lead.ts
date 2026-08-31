/**
 * Cloudflare Pages Function — POST /api/lead
 *
 * Delivers a lead to email (MailChannels or Resend) and, if configured,
 * forwards the same payload to an external CRM webhook.
 *
 * Environment variables (Pages → Settings → Environment variables):
 *   LEAD_TO           required   where leads land, e.g. contact@shaiomedia.com
 *   LEAD_FROM         required   a verified sender on your domain, e.g. site@shaiomedia.com
 *   RESEND_API_KEY    optional   if set, sends via Resend instead of MailChannels
 *   CRM_WEBHOOK_URL   optional   any HTTPS endpoint; receives the raw JSON lead
 *   CRM_WEBHOOK_TOKEN optional   sent as `Authorization: Bearer <token>`
 */

interface Env {
  LEAD_TO: string;
  LEAD_FROM: string;
  RESEND_API_KEY?: string;
  CRM_WEBHOOK_URL?: string;
  CRM_WEBHOOK_TOKEN?: string;
}

type Lead = {
  name?: string;
  phone?: string;
  email?: string;
  service?: string;
  message?: string;
  company_website?: string; // honeypot
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const esc = (s = "") =>
  s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let lead: Lead;
  try {
    lead = await request.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  // Honeypot: pretend success so bots don't learn anything
  if (lead.company_website) return json({ ok: true });

  const name = (lead.name ?? "").trim();
  const phone = (lead.phone ?? "").trim();
  const email = (lead.email ?? "").trim();

  if (name.length < 2) return json({ error: "invalid_name" }, 422);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: "invalid_email" }, 422);
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return json({ error: "invalid_phone" }, 422);

  const meta = {
    receivedAt: new Date().toISOString(),
    ip: request.headers.get("cf-connecting-ip") ?? "",
    country: (request as { cf?: { country?: string } }).cf?.country ?? "",
    userAgent: request.headers.get("user-agent") ?? "",
    referer: request.headers.get("referer") ?? "",
  };

  const payload = {
    name,
    phone,
    email,
    service: (lead.service ?? "").trim(),
    message: (lead.message ?? "").trim(),
    source: "shaiomedia.com",
    ...meta,
  };

  const rows = [
    ["שם", payload.name],
    ["טלפון", payload.phone],
    ["אימייל", payload.email],
    ["שירות", payload.service],
    ["הודעה", payload.message || "—"],
    ["מקור", payload.referer || "ישיר"],
    ["התקבל", payload.receivedAt],
  ];

  const html = `<div dir="rtl" style="font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;line-height:1.6">
<h2 style="margin:0 0 12px">ליד חדש מהאתר</h2>
<table cellpadding="7" style="border-collapse:collapse;font-size:15px">
${rows.map(([k, v]) => `<tr><td style="border:1px solid #e5e5ef;background:#fafaff;font-weight:600">${esc(k)}</td><td style="border:1px solid #e5e5ef">${esc(v)}</td></tr>`).join("")}
</table></div>`;

  const subject = `ליד חדש: ${name}${payload.service ? ` — ${payload.service}` : ""}`;

  // --- Email ---------------------------------------------------------
  let emailOk = false;
  try {
    if (env.RESEND_API_KEY) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.RESEND_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: env.LEAD_FROM,
          to: [env.LEAD_TO],
          reply_to: email,
          subject,
          html,
        }),
      });
      emailOk = r.ok;
    } else {
      const r = await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: env.LEAD_TO }] }],
          from: { email: env.LEAD_FROM, name: "shaiomedia.com" },
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

  // --- CRM webhook (fire alongside, never block the visitor) ----------
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

  // If every delivery path failed the visitor must be told to use WhatsApp
  if (!emailOk && crmOk !== true) return json({ error: "delivery_failed" }, 502);

  return json({ ok: true, email: emailOk, crm: crmOk });
};
