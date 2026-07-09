import { AREA, COMPANY, DISCLAIMER, REVALIDATE_SECONDS } from "../lib/config";
import { getClinicalTrials } from "../lib/sources/clinicaltrials";
import { getApprovedTherapies } from "../lib/sources/openfda";
import { getPublications, getPublicationCountsByYear } from "../lib/sources/europepmc";
import { getNews } from "../lib/sources/news";
import { trialsByPhase } from "../lib/aggregate";
import { formatDate, timeAgo, truncate, parseDate } from "../lib/format";
import DigestCard from "../components/DigestCard";
import StackedPhaseBar from "../components/mini/StackedPhaseBar";
import Sparkline from "../components/mini/Sparkline";

export const revalidate = REVALIDATE_SECONDS;

const ACCENT = {
  regulatory: "#0047bb",
  trials: "#002a61",
  evidence: "#3a7d18",
  news: "#00a3da",
};

export default async function BriefCover() {
  const [trials, therapies, pubs, pubYears, news] = await Promise.all([
    getClinicalTrials(),
    getApprovedTherapies(),
    getPublications(6),
    getPublicationCountsByYear(6),
    getNews(8),
  ]);

  const phaseData = trialsByPhase(trials.items);
  const recruiting = trials.items.filter((t) => {
    const s = String(t.status).toUpperCase();
    return s.includes("RECRUITING") && !s.includes("NOT");
  }).length;

  // Newest approval = highest effective date across approved therapies.
  const newest = [...therapies.items].sort(
    (a, b) => (parseDate(b.effectiveDate)?.getTime() || 0) - (parseDate(a.effectiveDate)?.getTime() || 0)
  )[0];

  const trialTotal = trials.total ?? trials.items.length;
  const pubTotal = pubs.total ?? null;
  const issueDate = formatDate(new Date());

  return (
    <>
      {/* ---------- Cover ---------- */}
      <section className="cover">
        <p className="cover__date">{COMPANY.shortName} Intelligence · {issueDate}</p>
        <h1 className="cover__title">{AREA.label} Intelligence Brief</h1>
        <p className="cover__summary">
          The current {AREA.label} landscape at a glance:{" "}
          <strong>{fmt(trialTotal)}</strong> registered trials,{" "}
          <strong>{therapies.items.length}</strong> approved therapies, and{" "}
          <strong>{fmt(pubTotal)}</strong> indexed publications — refreshed daily, each linked to its source.
        </p>

        {newest ? (
          <div className="hl">
            <span className="hl__tag">Newest approval</span>
            <span className="hl__text">
              <strong>{newest.brand}</strong> ({newest.generic}) — {newest.manufacturer},{" "}
              {formatDate(newest.effectiveDate)}
            </span>
            <a href="/therapies">See all approvals</a>
          </div>
        ) : null}
      </section>

      {/* ---------- Glance strip ---------- */}
      <section className="glance" aria-label="Landscape summary">
        <div className="glance__item">
          <p className="glance__label"><span className="glance__dot" style={{ background: ACCENT.trials }} />Trials</p>
          <div className="glance__value">{fmt(trialTotal)}</div>
          <p className="glance__sub">{recruiting} recruiting now</p>
        </div>
        <div className="glance__item">
          <p className="glance__label"><span className="glance__dot" style={{ background: ACCENT.regulatory }} />Approved</p>
          <div className="glance__value">{therapies.items.length}</div>
          <p className="glance__sub">therapies on the market</p>
        </div>
        <div className="glance__item">
          <p className="glance__label"><span className="glance__dot" style={{ background: ACCENT.evidence }} />Publications</p>
          <div className="glance__value">{fmt(pubTotal)}</div>
          <p className="glance__sub">in the literature</p>
        </div>
        <div className="glance__item">
          <p className="glance__label"><span className="glance__dot" style={{ background: ACCENT.news }} />Headlines</p>
          <div className="glance__value">{news.items.length}</div>
          <p className="glance__sub">in the latest pull</p>
        </div>
      </section>

      {/* ---------- Digest cards ---------- */}
      <section className="digest-grid">
        {/* Regulatory */}
        <DigestCard
          accent={ACCENT.regulatory}
          eyebrow="Regulatory"
          title="Approved Therapies"
          count={`${therapies.items.length} total`}
          href="/therapies"
          hrefLabel="View all approvals"
        >
          <div className="mini-list">
            {therapies.items.slice(0, 4).map((d) => (
              <div className="mini-item" key={d.id}>
                <div className="mini-item__title">
                  <a href={d.url} target="_blank" rel="noreferrer">{d.brand}</a>{" "}
                  <span className="muted" style={{ fontWeight: 400 }}>· {d.generic}</span>
                </div>
                <div className="mini-item__meta">{d.manufacturer} · {formatDate(d.effectiveDate)}</div>
              </div>
            ))}
          </div>
        </DigestCard>

        {/* Trials */}
        <DigestCard
          accent={ACCENT.trials}
          eyebrow="Clinical Development"
          title="Trial Landscape"
          count={`${fmt(trialTotal)} trials`}
          href="/trials"
          hrefLabel="Explore all trials"
        >
          <div className="dcard__viz">
            <StackedPhaseBar data={phaseData} />
          </div>
          <div className="mini-list">
            {trials.items.slice(0, 3).map((t) => (
              <div className="mini-item" key={t.id}>
                <div className="mini-item__title">
                  <a href={t.url} target="_blank" rel="noreferrer">{t.title}</a>
                </div>
                <div className="mini-item__meta">
                  {t.phase !== "NA" ? `${t.phase} · ` : ""}{t.sponsor} · updated {formatDate(t.lastUpdate)}
                </div>
              </div>
            ))}
          </div>
        </DigestCard>

        {/* Evidence */}
        <DigestCard
          accent={ACCENT.evidence}
          eyebrow="Evidence"
          title="Literature"
          count={pubTotal != null ? `${fmt(pubTotal)} papers` : null}
          href="/publications"
          hrefLabel="Browse the literature"
        >
          <div className="dcard__viz">
            <Sparkline points={pubYears.items} />
          </div>
          <div className="mini-list">
            {pubs.items.slice(0, 3).map((p) => (
              <div className="mini-item" key={p.id}>
                <div className="mini-item__title">
                  <a href={p.url} target="_blank" rel="noreferrer">{p.title}</a>
                </div>
                <div className="mini-item__meta">
                  {p.isPreprint ? "Preprint" : p.journal || "Journal"} · {formatDate(p.date)}
                </div>
              </div>
            ))}
          </div>
        </DigestCard>

        {/* News */}
        <DigestCard
          accent={ACCENT.news}
          eyebrow="Signal"
          title="News & Announcements"
          count={`${news.items.length} recent`}
          href="/news"
          hrefLabel="More headlines"
        >
          <div className="mini-list">
            {news.items.slice(0, 5).map((n) => (
              <div className="mini-item" key={n.id}>
                <div className="mini-item__title">
                  <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
                </div>
                <div className="mini-item__meta">{n.outlet}{n.date ? ` · ${timeAgo(n.date)}` : ""}</div>
              </div>
            ))}
          </div>
        </DigestCard>
      </section>

      {/* ---------- Actions ---------- */}
      <div className="cover-actions">
        <a className="btn" href="/visuals">View full analytics &rarr;</a>
        <a className="btn btn--ghost" href="/brief">Email-ready version &rarr;</a>
      </div>

      <p className="notice" style={{ marginTop: 16 }}>{DISCLAIMER}</p>
      <div className="spacer-24" />
    </>
  );
}

function fmt(n) {
  return n == null ? "—" : Number(n).toLocaleString();
}
