import { notFound } from "next/navigation";
import { COMPANY, DISCLAIMER, REVALIDATE_SECONDS, getIndication, listIndications } from "../../lib/config";
import { getClinicalTrials } from "../../lib/sources/clinicaltrials";
import { getApprovedTherapies } from "../../lib/sources/openfda";
import { getPublications, getPublicationCountsByYear } from "../../lib/sources/europepmc";
import { getNews } from "../../lib/sources/news";
import { trialsByPhase } from "../../lib/aggregate";
import { formatDate, timeAgo, parseDate } from "../../lib/format";
import DigestCard from "../../components/DigestCard";
import StackedPhaseBar from "../../components/mini/StackedPhaseBar";
import Sparkline from "../../components/mini/Sparkline";

export const revalidate = REVALIDATE_SECONDS;
export function generateStaticParams() {
  return listIndications().map((i) => ({ indication: i.slug }));
}
export function generateMetadata({ params }) {
  const area = getIndication(params.indication);
  return { title: area ? `${area.label} — ${COMPANY.product}` : COMPANY.product };
}

const DOMAIN = { regulatory: "#0047bb", trials: "#002a61", evidence: "#3a7d18", news: "#00a3da" };

export default async function BriefCover({ params }) {
  const area = getIndication(params.indication);
  if (!area) notFound();
  const base = `/${area.slug}`;

  const [trials, therapies, pubs, pubYears, news] = await Promise.all([
    getClinicalTrials(area),
    getApprovedTherapies(area),
    getPublications(area, 6),
    getPublicationCountsByYear(area, 6),
    getNews(area, 8),
  ]);

  const phaseData = trialsByPhase(trials.items);
  const recruiting = trials.items.filter((t) => {
    const s = String(t.status).toUpperCase();
    return s.includes("RECRUITING") && !s.includes("NOT");
  }).length;
  const newest = [...therapies.items].sort(
    (a, b) => (parseDate(b.effectiveDate)?.getTime() || 0) - (parseDate(a.effectiveDate)?.getTime() || 0)
  )[0];

  const trialTotal = trials.total ?? trials.items.length;
  const pubTotal = pubs.total ?? null;
  const issueDate = formatDate(new Date());

  return (
    <>
      <section className="cover">
        <p className="cover__date">{COMPANY.shortName} Intelligence · {issueDate}</p>
        <h1 className="cover__title">{area.label} Intelligence Brief</h1>
        <p className="cover__summary">
          The current {area.label} landscape at a glance:{" "}
          <strong>{fmt(trialTotal)}</strong> registered trials,{" "}
          <strong>{therapies.items.length}</strong> approved therapies, and{" "}
          <strong>{fmt(pubTotal)}</strong> indexed publications — refreshed daily, each linked to its source.
        </p>
        {newest ? (
          <div className="hl">
            <span className="hl__tag">Newest approval</span>
            <span className="hl__text">
              <strong>{newest.brand}</strong> ({newest.generic}) — {newest.manufacturer}
              {newest.effectiveDate ? `, ${formatDate(newest.effectiveDate)}` : ""}
            </span>
            <a href={`${base}/therapies`}>See all approvals</a>
          </div>
        ) : null}
      </section>

      <section className="glance" aria-label="Landscape summary">
        <div className="glance__item">
          <p className="glance__label"><span className="glance__dot" style={{ background: DOMAIN.trials }} />Trials</p>
          <div className="glance__value">{fmt(trialTotal)}</div>
          <p className="glance__sub">{recruiting} recruiting now</p>
        </div>
        <div className="glance__item">
          <p className="glance__label"><span className="glance__dot" style={{ background: DOMAIN.regulatory }} />Approved</p>
          <div className="glance__value">{therapies.items.length}</div>
          <p className="glance__sub">therapies tracked</p>
        </div>
        <div className="glance__item">
          <p className="glance__label"><span className="glance__dot" style={{ background: DOMAIN.evidence }} />Publications</p>
          <div className="glance__value">{fmt(pubTotal)}</div>
          <p className="glance__sub">in the literature</p>
        </div>
        <div className="glance__item">
          <p className="glance__label"><span className="glance__dot" style={{ background: DOMAIN.news }} />Headlines</p>
          <div className="glance__value">{news.items.length}</div>
          <p className="glance__sub">in the latest pull</p>
        </div>
      </section>

      <section className="digest-grid">
        <DigestCard accent={DOMAIN.regulatory} eyebrow="Regulatory" title="Approved Therapies"
          count={`${therapies.items.length} total`} href={`${base}/therapies`} hrefLabel="View all approvals">
          <div className="mini-list">
            {therapies.items.slice(0, 4).map((d) => (
              <div className="mini-item" key={d.id}>
                <div className="mini-item__title">
                  <a href={d.url} target="_blank" rel="noreferrer">{d.brand}</a>{" "}
                  <span className="muted" style={{ fontWeight: 400 }}>· {d.generic}</span>
                </div>
                <div className="mini-item__meta">
                  {d.manufacturer}{d.effectiveDate ? ` · ${formatDate(d.effectiveDate)}` : ""}
                  {d.applNo ? ` · ${d.applNo}` : ""}
                </div>
              </div>
            ))}
          </div>
        </DigestCard>

        <DigestCard accent={DOMAIN.trials} eyebrow="Clinical Development" title="Trial Landscape"
          count={`${fmt(trialTotal)} trials`} href={`${base}/trials`} hrefLabel="Explore all trials">
          <div className="dcard__viz"><StackedPhaseBar data={phaseData} /></div>
          <div className="mini-list">
            {trials.items.slice(0, 3).map((t) => (
              <div className="mini-item" key={t.id}>
                <div className="mini-item__title"><a href={t.url} target="_blank" rel="noreferrer">{t.title}</a></div>
                <div className="mini-item__meta">
                  {t.phase !== "NA" ? `${t.phase} · ` : ""}{t.sponsor} · updated {formatDate(t.lastUpdate)}
                </div>
              </div>
            ))}
          </div>
        </DigestCard>

        <DigestCard accent={DOMAIN.evidence} eyebrow="Evidence" title="Literature"
          count={pubTotal != null ? `${fmt(pubTotal)} papers` : null} href={`${base}/publications`} hrefLabel="Browse the literature">
          <div className="dcard__viz"><Sparkline points={pubYears.items} /></div>
          <div className="mini-list">
            {pubs.items.slice(0, 3).map((p) => (
              <div className="mini-item" key={p.id}>
                <div className="mini-item__title"><a href={p.url} target="_blank" rel="noreferrer">{p.title}</a></div>
                <div className="mini-item__meta">{p.isPreprint ? "Preprint" : p.journal || "Journal"} · {formatDate(p.date)}</div>
              </div>
            ))}
          </div>
        </DigestCard>

        <DigestCard accent={DOMAIN.news} eyebrow="Signal" title="News & Announcements"
          count={`${news.items.length} recent`} href={`${base}/news`} hrefLabel="More headlines">
          <div className="mini-list">
            {news.items.slice(0, 5).map((n) => (
              <div className="mini-item" key={n.id}>
                <div className="mini-item__title"><a href={n.url} target="_blank" rel="noreferrer">{n.title}</a></div>
                <div className="mini-item__meta">{n.outlet}{n.date ? ` · ${timeAgo(n.date)}` : ""}</div>
              </div>
            ))}
          </div>
        </DigestCard>
      </section>

      <div className="cover-actions">
        <a className="btn" href={`${base}/visuals`}>View full analytics &rarr;</a>
        <a className="btn btn--ghost" href={`${base}/brief`}>Email-ready version &rarr;</a>
      </div>

      <p className="notice" style={{ marginTop: 16 }}>{DISCLAIMER}</p>
      <div className="spacer-24" />
    </>
  );
}

function fmt(n) { return n == null ? "—" : Number(n).toLocaleString(); }
