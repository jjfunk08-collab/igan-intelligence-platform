import { notFound } from "next/navigation";
import { COMPANY, REVALIDATE_SECONDS, getIndication, listIndications } from "../../../lib/config";
import { getClinicalTrials } from "../../../lib/sources/clinicaltrials";
import { getApprovedTherapies } from "../../../lib/sources/openfda";
import { getPublications } from "../../../lib/sources/europepmc";
import { getNews } from "../../../lib/sources/news";
import CopyBrief from "../../../components/CopyBrief";
import SubscribeForm from "../../../components/SubscribeForm";

// ---------------------------------------------------------------------------
// This page is deliberately SELF-CONTAINED. All date/text helpers and the
// brief-building logic are defined in THIS file rather than imported, so the
// page cannot fail with "X is not defined" due to an out-of-date imported
// module. It depends only on the data-source modules (which build fine).
// ---------------------------------------------------------------------------
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value) ? null : value;
  const s = String(value).trim();
  if (/^\d{8}$/.test(s)) {
    const d = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00Z`);
    return isNaN(d) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
}
function formatDate(value) {
  const d = parseDate(value);
  if (!d) return "\u2014";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function timeAgo(value) {
  const d = parseDate(value);
  if (!d) return "";
  const diff = Date.now() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diff / day);
  if (days < 0) return formatDate(d);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} mo ago`;
  return `${Math.floor(days / 365)} yr ago`;
}
function truncate(text, max = 220) {
  if (!text) return "";
  const s = String(text).replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return s.slice(0, s.lastIndexOf(" ", max)).trim() + "\u2026";
}

function buildBriefText({ area, issueDate, topTrials, topTherapies, topPubs, topNews }) {
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

export const revalidate = REVALIDATE_SECONDS;
export function generateStaticParams() { return listIndications().map((i) => ({ indication: i.slug })); }
export function generateMetadata({ params }) {
  const a = getIndication(params.indication);
  return { title: a ? `${a.label} Brief — ${COMPANY.product}` : COMPANY.product };
}

export default async function BriefPage({ params }) {
  const area = getIndication(params.indication);
  if (!area) notFound();

  const [trials, therapies, pubs, news] = await Promise.all([
    getClinicalTrials(area),
    getApprovedTherapies(area),
    getPublications(area, 20),
    getNews(area, 20),
  ]);
  const issueDate = formatDate(new Date());
  const topTrials = trials.items.slice(0, 5);
  const topTherapies = therapies.items.slice(0, 6);
  const topPubs = pubs.items.slice(0, 6);
  const topNews = news.items.slice(0, 8);
  const plainText = buildBriefText({ area, issueDate, topTrials, topTherapies, topPubs, topNews });

  return (
    <div className="brief">
      <div className="spacer-24" />
      <a href={`/${area.slug}`} className="link-more">&larr; Back to the {area.short} brief</a>
      <div className="brief__masthead" style={{ marginTop: 12 }}>
        <p className="brief__kicker">{COMPANY.shortName} · Intelligence Brief · {issueDate}</p>
        <h1 className="brief__title">This Week in {area.label}</h1>
        <p className="brief__tagline">{COMPANY.tagline}</p>
        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <CopyBrief text={plainText} />
        </div>
      </div>

      <SubscribeForm indication={area.slug} label={area.label} accent={area.accent} />

      <h2 className="brief__section-title">Trials — Recently Updated</h2>
      {topTrials.length === 0 ? <p className="muted">No recent trial updates.</p> :
        topTrials.map((t) => (
          <div className="brief__entry" key={t.id}>
            <a href={t.url} target="_blank" rel="noreferrer">{t.title}</a>
            <div className="feed__meta">
              {t.phase !== "NA" ? `${t.phase} · ` : ""}{String(t.status).replace(/_/g, " ")} · {t.sponsor} · <span className="mono">{t.id}</span> · updated {formatDate(t.lastUpdate)}
            </div>
          </div>
        ))}

      <h2 className="brief__section-title">Regulatory — Approved Therapies (Drugs@FDA)</h2>
      {topTherapies.map((d) => (
        <div className="brief__entry" key={d.id}>
          <a href={d.url} target="_blank" rel="noreferrer">{d.brand}</a> <span className="muted">({d.generic})</span>
          {!d.live ? <span className="badge badge--preprint" style={{ marginLeft: 8 }}>Curated</span> : null}
          <div className="feed__meta">{d.manufacturer}{d.applNo ? ` · ${d.applNo}` : ""}{d.effectiveDate ? ` · ${formatDate(d.effectiveDate)}` : ""}</div>
        </div>
      ))}

      <h2 className="brief__section-title">Evidence — New Literature</h2>
      {topPubs.map((p) => (
        <div className="brief__entry" key={p.id}>
          <a href={p.url} target="_blank" rel="noreferrer">{p.title}</a>
          <div className="feed__meta">{truncate(p.authors, 90)}{p.journal ? ` — ${p.journal}` : ""} · {formatDate(p.date)}</div>
        </div>
      ))}

      <h2 className="brief__section-title">Signal — Headlines</h2>
      {topNews.map((n) => (
        <div className="brief__entry" key={n.id}>
          <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
          <div className="feed__meta">{n.outlet}{n.date ? ` · ${timeAgo(n.date)}` : ""}</div>
        </div>
      ))}

      <div className="spacer-24" />
      <p className="notice">
        Compiled automatically from ClinicalTrials.gov, Drugs@FDA, Europe PMC, and public news feeds.
        Prepared for {COMPANY.legalName}.
      </p>
      <div className="spacer-24" />
    </div>
  );
}
