import { notFound } from "next/navigation";
import { COMPANY, REVALIDATE_SECONDS, getIndication, listIndications } from "../../../lib/config";
import { getBriefData, buildBriefText } from "../../../lib/briefContent";
import { formatDate, timeAgo, truncate } from "../../../lib/format";
import CopyBrief from "../../../components/CopyBrief";
import SubscribeForm from "../../../components/SubscribeForm";

export const revalidate = REVALIDATE_SECONDS;
export function generateStaticParams() { return listIndications().map((i) => ({ indication: i.slug })); }
export function generateMetadata({ params }) {
  const a = getIndication(params.indication);
  return { title: a ? `${a.label} Brief — ${COMPANY.product}` : COMPANY.product };
}

export default async function BriefPage({ params }) {
  const area = getIndication(params.indication);
  if (!area) notFound();

  const { issueDate, topTrials, topTherapies, topPubs, topNews } = await getBriefData(area);
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
