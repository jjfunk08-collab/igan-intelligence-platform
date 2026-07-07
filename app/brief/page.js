import { AREA, COMPANY, REVALIDATE_SECONDS } from "../../lib/config";
import { getClinicalTrials } from "../../lib/sources/clinicaltrials";
import { getApprovedTherapies } from "../../lib/sources/openfda";
import { getPublications } from "../../lib/sources/europepmc";
import { getNews } from "../../lib/sources/news";
import { formatDate, timeAgo, truncate } from "../../lib/format";
import CopyBrief from "../../components/CopyBrief";

export const revalidate = REVALIDATE_SECONDS;

export const metadata = {
  title: `Weekly Brief — ${COMPANY.product}`,
};

export default async function BriefPage() {
  const [trials, therapies, pubs, news] = await Promise.all([
    getClinicalTrials(40),
    getApprovedTherapies(20),
    getPublications(20),
    getNews(20),
  ]);

  const issueDate = formatDate(new Date());
  const topTrials = trials.items.slice(0, 5);
  const topPubs = pubs.items.slice(0, 6);
  const topNews = news.items.slice(0, 8);
  const topTherapies = therapies.items.slice(0, 6);

  const plainText = buildPlainText({
    issueDate, topTrials, topTherapies, topPubs, topNews,
  });

  return (
    <div className="brief">
      <div className="spacer-24" />
      <div className="brief__masthead">
        <p className="brief__kicker">{COMPANY.shortName} · Intelligence Brief · {issueDate}</p>
        <h1 className="brief__title">This Week in {AREA.label}</h1>
        <p className="brief__tagline">{COMPANY.tagline}</p>
        <div style={{ marginTop: 14 }}>
          <CopyBrief text={plainText} />
        </div>
      </div>

      {/* Trials */}
      <h2 className="brief__section-title">Trials — Recently Updated</h2>
      {topTrials.length === 0 ? (
        <p className="muted">No recent trial updates in the latest pull.</p>
      ) : (
        topTrials.map((t) => (
          <div className="brief__entry" key={t.id}>
            <a href={t.url} target="_blank" rel="noreferrer">{t.title}</a>
            <div className="feed__meta">
              {t.phase !== "NA" ? `${t.phase} · ` : ""}{t.status?.replace(/_/g, " ")} · {t.sponsor} ·{" "}
              <span className="mono">{t.id}</span> · updated {formatDate(t.lastUpdate)}
            </div>
          </div>
        ))
      )}

      {/* Approvals */}
      <h2 className="brief__section-title">Regulatory — Approved Therapies</h2>
      {topTherapies.length === 0 ? (
        <p className="muted">No labeled products returned in the latest pull.</p>
      ) : (
        topTherapies.map((d) => (
          <div className="brief__entry" key={d.id}>
            <a href={d.url} target="_blank" rel="noreferrer">{d.brand}</a>{" "}
            <span className="muted">({d.generic})</span>
            <div className="feed__meta">{d.manufacturer} · label {formatDate(d.effectiveDate)}</div>
          </div>
        ))
      )}

      {/* Literature */}
      <h2 className="brief__section-title">Evidence — New Literature</h2>
      {topPubs.length === 0 ? (
        <p className="muted">No new publications in the latest pull.</p>
      ) : (
        topPubs.map((p) => (
          <div className="brief__entry" key={p.id}>
            <a href={p.url} target="_blank" rel="noreferrer">{p.title}</a>
            <div className="feed__meta">
              {truncate(p.authors, 90)}{p.journal ? ` — ${p.journal}` : ""} · {formatDate(p.date)}
            </div>
          </div>
        ))
      )}

      {/* News */}
      <h2 className="brief__section-title">Signal — Headlines</h2>
      {topNews.length === 0 ? (
        <p className="muted">No headlines in the latest pull.</p>
      ) : (
        topNews.map((n) => (
          <div className="brief__entry" key={n.id}>
            <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
            <div className="feed__meta">{n.outlet}{n.date ? ` · ${timeAgo(n.date)}` : ""}</div>
          </div>
        ))
      )}

      <div className="spacer-24" />
      <p className="notice">
        Compiled automatically from ClinicalTrials.gov, openFDA, Europe PMC, and public news
        feeds. Figures reflect the most recent daily refresh. Prepared for {COMPANY.legalName}{" "}
        by {COMPANY.developer}.
      </p>
      <div className="spacer-24" />
    </div>
  );
}

function buildPlainText({ issueDate, topTrials, topTherapies, topPubs, topNews }) {
  const lines = [];
  lines.push(`THIS WEEK IN IGA NEPHROPATHY — ${issueDate}`);
  lines.push("Setting a New Course · Biohaven Intelligence Brief");
  lines.push("");
  lines.push("TRIALS — RECENTLY UPDATED");
  topTrials.forEach((t) =>
    lines.push(`- ${t.title} (${t.id}) — ${t.phase}, ${String(t.status).replace(/_/g, " ")}, ${t.sponsor}. ${t.url}`)
  );
  lines.push("");
  lines.push("REGULATORY — APPROVED THERAPIES");
  topTherapies.forEach((d) => lines.push(`- ${d.brand} (${d.generic}) — ${d.manufacturer}. ${d.url}`));
  lines.push("");
  lines.push("EVIDENCE — NEW LITERATURE");
  topPubs.forEach((p) => lines.push(`- ${p.title} — ${p.journal || "n/a"} (${formatDate(p.date)}). ${p.url}`));
  lines.push("");
  lines.push("SIGNAL — HEADLINES");
  topNews.forEach((n) => lines.push(`- ${n.title} — ${n.outlet}. ${n.url}`));
  lines.push("");
  lines.push("Compiled from ClinicalTrials.gov, openFDA, Europe PMC, and public news feeds.");
  return lines.join("\n");
}
