// One source of truth for "the brief" — used by the on-site /brief page AND
// the automated email, so the two never drift apart.

import { COMPANY } from "./config";
import { getClinicalTrials } from "./sources/clinicaltrials";
import { getApprovedTherapies } from "./sources/openfda";
import { getPublications } from "./sources/europepmc";
import { getNews } from "./sources/news";
import { formatDate, timeAgo, truncate } from "./format";

export async function getBriefData(area) {
  const [trials, therapies, pubs, news] = await Promise.all([
    getClinicalTrials(area),
    getApprovedTherapies(area),
    getPublications(area, 20),
    getNews(area, 20),
  ]);
  return {
    issueDate: formatDate(new Date()),
    topTrials: trials.items.slice(0, 5),
    topTherapies: therapies.items.slice(0, 6),
    topPubs: pubs.items.slice(0, 6),
    topNews: news.items.slice(0, 8),
  };
}

export function buildBriefText({ area, issueDate, topTrials, topTherapies, topPubs, topNews }) {
  const L = [];
  L.push(`THIS WEEK IN ${area.label.toUpperCase()} — ${issueDate}`);
  L.push(`${COMPANY.tagline} · ${COMPANY.shortName} Intelligence Brief`);
  L.push("");
  L.push("TRIALS — RECENTLY UPDATED");
  topTrials.forEach((t) => L.push(`- ${t.title} (${t.id}) — ${t.phase}, ${String(t.status).replace(/_/g, " ")}, ${t.sponsor}. ${t.url}`));
  L.push("");
  L.push("REGULATORY — APPROVED THERAPIES (DRUGS@FDA)");
  topTherapies.forEach((d) => L.push(`- ${d.brand} (${d.generic}) — ${d.manufacturer}${d.applNo ? ", " + d.applNo : ""}. ${d.url}`));
  L.push("");
  L.push("EVIDENCE — NEW LITERATURE");
  topPubs.forEach((p) => L.push(`- ${p.title} — ${p.journal || "n/a"} (${formatDate(p.date)}). ${p.url}`));
  L.push("");
  L.push("SIGNAL — HEADLINES");
  topNews.forEach((n) => L.push(`- ${n.title} — ${n.outlet}. ${n.url}`));
  return L.join("\n");
}

// Minimal, inline-styled HTML — email clients don't load external CSS, so
// this intentionally does not reuse app/globals.css.
export function buildBriefHtml({ area, issueDate, topTrials, topTherapies, topPubs, topNews }, { unsubscribeUrl, siteUrl } = {}) {
  const navy = "#002a61", ink = "#17233a", muted = "#5b6b84", line = "#dbe3ee", accent = area.accent || "#0047bb";

  const section = (title, rows) => `
    <tr><td style="padding:22px 0 8px;">
      <p style="margin:0;font:600 11px/1 'Courier New',monospace;letter-spacing:.08em;text-transform:uppercase;color:${accent};">${esc(title)}</p>
    </td></tr>
    ${rows}
  `;
  const row = (title, url, meta) => `
    <tr><td style="padding:10px 0;border-bottom:1px solid ${line};">
      <a href="${esc(url)}" style="font:600 14px/1.35 Arial,sans-serif;color:${navy};text-decoration:none;">${esc(title)}</a>
      <div style="font:12px/1.4 Arial,sans-serif;color:${muted};margin-top:3px;">${meta}</div>
    </td></tr>
  `;
  const empty = (label) => `<tr><td style="padding:10px 0;font:13px Arial,sans-serif;color:${muted};">No recent ${label}.</td></tr>`;

  const trialsHtml = topTrials.length
    ? topTrials.map((t) => row(t.title, t.url, `${t.phase !== "NA" ? t.phase + " · " : ""}${esc(String(t.status).replace(/_/g, " "))} · ${esc(t.sponsor)} · updated ${formatDate(t.lastUpdate)}`)).join("")
    : empty("trial updates");
  const therapiesHtml = topTherapies.length
    ? topTherapies.map((d) => row(`${d.brand} (${d.generic})`, d.url, `${esc(d.manufacturer)}${d.applNo ? " · " + esc(d.applNo) : ""}${d.effectiveDate ? " · " + formatDate(d.effectiveDate) : ""}`)).join("")
    : empty("approvals");
  const pubsHtml = topPubs.length
    ? topPubs.map((p) => row(p.title, p.url, `${esc(truncate(p.authors, 80))}${p.journal ? " — " + esc(p.journal) : ""} · ${formatDate(p.date)}`)).join("")
    : empty("literature");
  const newsHtml = topNews.length
    ? topNews.map((n) => row(n.title, n.url, `${esc(n.outlet)}${n.date ? " · " + timeAgo(n.date) : ""}`)).join("")
    : empty("headlines");

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f6fa;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fa;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid ${line};">
  <tr><td style="background:${navy};padding:22px 28px;border-bottom:3px solid ${accent};">
    <p style="margin:0;font:600 11px/1 'Courier New',monospace;letter-spacing:.08em;text-transform:uppercase;color:${accent};">${esc(COMPANY.shortName)} Intelligence · ${esc(issueDate)}</p>
    <h1 style="margin:6px 0 0;font:700 22px/1.25 Arial,sans-serif;color:#ffffff;">This Week in ${esc(area.label)}</h1>
  </td></tr>
  <tr><td style="padding:6px 28px 24px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${section("Trials — Recently Updated", trialsHtml)}
      ${section("Regulatory — Approved Therapies", therapiesHtml)}
      ${section("Evidence — New Literature", pubsHtml)}
      ${section("Signal — Headlines", newsHtml)}
    </table>
    ${siteUrl ? `<p style="margin:22px 0 0;"><a href="${esc(siteUrl)}" style="font:600 13px Arial,sans-serif;color:${accent};text-decoration:none;">View the full, always-up-to-date brief →</a></p>` : ""}
  </td></tr>
  <tr><td style="padding:16px 28px;border-top:1px solid ${line};">
    <p style="margin:0;font:11.5px/1.5 Arial,sans-serif;color:${muted};">
      Compiled automatically from ClinicalTrials.gov, Drugs@FDA, Europe PMC, and public news feeds. Prepared for ${esc(COMPANY.legalName)}. Internal use only — not medical advice.
      ${unsubscribeUrl ? ` · <a href="${esc(unsubscribeUrl)}" style="color:${muted};">Unsubscribe</a>` : ""}
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
