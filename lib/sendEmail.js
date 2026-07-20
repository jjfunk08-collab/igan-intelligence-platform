// Sends transactional email via Resend's REST API — plain fetch, no SDK.
// Requires RESEND_API_KEY. RESEND_FROM should be a verified sender (e.g.
// "IgAN Intelligence <briefs@yourdomain.com>"); until a domain is verified in
// Resend, "onboarding@resend.dev" works for testing to any address.
// Docs: https://resend.com/docs/api-reference/emails/send-email

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM || "onboarding@resend.dev";

export function emailConfigured() {
  return !!API_KEY;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!emailConfigured()) {
    throw new Error("Email sending is not configured yet — set RESEND_API_KEY.");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html, text }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Resend error (${res.status})`);
  return data; // { id: "..." }
}
