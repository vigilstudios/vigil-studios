import "server-only";

import { Resend } from "resend";

/**
 * Transactional email through Resend. Without RESEND_API_KEY every send is
 * logged instead of sent, so development never emails a real customer and
 * the calling code does not need to care.
 */
const FROM = process.env.EMAIL_FROM ?? "Vigil Studios <hello@vigilstudios.co>";
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? "hello@vigilstudios.co";

export type EmailMessage = { to: string; subject: string; html: string; text: string };

export async function sendEmail(message: EmailMessage): Promise<{ sent: boolean; id?: string; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email:dry-run] to=${message.to} subject=${JSON.stringify(message.subject)}\n${message.text}`);
    return { sent: false };
  }
  try {
    const resend = new Resend(key);
    const { data, error } = await resend.emails.send({ from: FROM, to: message.to, reply_to: REPLY_TO, subject: message.subject, html: message.html, text: message.text });
    if (error) {
      console.error(`[email] send failed to=${message.to} subject=${JSON.stringify(message.subject)}: ${error.message}`);
      return { sent: false, error: error.message };
    }
    return { sent: true, id: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[email] send threw to=${message.to} subject=${JSON.stringify(message.subject)}: ${msg}`);
    return { sent: false, error: msg };
  }
}

export function staffNotificationAddress(): string {
  return process.env.STAFF_NOTIFY_EMAIL ?? "hello@vigilstudios.co";
}

/** Plain, calm HTML wrapper shared by every message. */
export function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f6f4;font:15px/1.6 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e6e6e2;border-radius:12px;padding:28px">
<p style="margin:0 0 20px;font-weight:700;letter-spacing:.02em">Vigil Studios</p>
<h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(title)}</h1>
${bodyHtml}
<p style="margin:24px 0 0;color:#666;font-size:13px">Questions? Reply to this email or write to hello@vigilstudios.co.</p>
</div></body></html>`;
}

export function button(href: string, label: string): string {
  return `<p style="margin:20px 0"><a href="${escapeAttr(href)}" style="display:inline-block;background:#10d45a;color:#0a0a0a;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">${escapeHtml(label)}</a></p>`;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
