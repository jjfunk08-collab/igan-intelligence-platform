import { notFound } from "next/navigation";
import { COMPANY, REVALIDATE_SECONDS, getIndication, listIndications } from "../../../lib/config";
import { getClinicalTrials } from "../../../lib/sources/clinicaltrials";
import { getApprovedTherapies } from "../../../lib/sources/openfda";
import { getPublications } from "../../../lib/sources/europepmc";
import { getNews } from "../../../lib/sources/news";
import { formatDate, timeAgo, truncate } from "../../../lib/format";
import CopyBrief from "../../../components/CopyBrief";

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
  const topPubs = pubs.items.slice(0, 6);
  const topNews = news.items.slice(0, 8);
  const topTherapies = therapies.items.slice(0, 6);

  const plainText = buildText({ area, issueDate, topTrials, topTherapies, topPubs, topNews });

  return (
    <div className="brief">
      <div className="spacer-24" />
      <a href={`/${area.slug}`} className="link-more">&larr; Back to the {area.short} brief</a>
      <div className="brief__masthead" style={{ marginTop: 12 }}>
        <p className="brief__kicker">{COMPANY.shortName} · Intelligence Brief · {issueDate}</p>
        <h1 className="brief__title">This Week in {area.label}</h1>
        <p className="brief__tagline">{COMPANY.tagline}</p>
        <div style={{ marginTop: 14 }}><CopyBrief text={plainText} /></div>
      </div>

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
        Prepared for {COMPANY.legalName} by {COMPANY.developer}.
      </p>
      <div className="spacer-24" />
    </div>
  );
}

function buildText({ area, issueDate, topTrials, topTherapies, topPubs, topNews }) {
  const L = [];
  L.push(`THIS WEEK IN ${area.label.toUpperCase()} — ${issueDate}`);
  L.push("Setting a New Course · Biohaven Intelligence Brief");
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
