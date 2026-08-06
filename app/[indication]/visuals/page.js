import { notFound } from "next/navigation";
import { COMPANY, REVALIDATE_SECONDS, getIndication, listIndications } from "../../../lib/config";
import { getClinicalTrials } from "../../../lib/sources/clinicaltrials";
import { getNews } from "../../../lib/sources/news";
import { competitiveLandscape, scoreProgressions, topSponsorsDetailed, trialsByPhase, projectedReadouts, recentlyUpdated } from "../../../lib/aggregate";
import { SectionHeader, SourceTag } from "../../../components/ui";
import { formatDate } from "../../../lib/format";
import PhaseBarChart from "../../../components/charts/PhaseBarChart";
import SponsorBarChart from "../../../components/charts/SponsorBarChart";
import CompetitiveLandscape from "../../../components/charts/CompetitiveLandscape";
import CompetitiveProgressions from "../../../components/CompetitiveProgressions";

export const revalidate = REVALIDATE_SECONDS;
export function generateStaticParams() { return listIndications().map((i) => ({ indication: i.slug })); }
export function generateMetadata({ params }) {
  const a = getIndication(params.indication);
  return { title: a ? `${a.label} Analytics — ${COMPANY.product}` : COMPANY.product };
}

export default async function VisualsPage({ params }) {
  const area = getIndication(params.indication);
  if (!area) notFound();
  const [trials, news] = await Promise.all([
    getClinicalTrials(area),
    getNews(area, 40),
  ]);
  const phaseData = trialsByPhase(trials.items);
  const sponsorData = topSponsorsDetailed(trials.items, 8);
  const landscape = competitiveLandscape(trials.items, area.knownApprovedTherapies || [], { limit: 40 });
  const initialProgressions = scoreProgressions(news.items, 3);
  const readouts = projectedReadouts(trials.items, 12);
  const changed = recentlyUpdated(trials.items, 12);

  return (
    <>
      <div className="spacer-24" />
      <a href={`/${area.slug}`} className="link-more">&larr; Back to the {area.short} brief</a>
      <p className="notice" style={{ marginTop: 12 }}>
        A focused visual read of the {area.label} landscape from the same daily-refreshed data. Hover any chart for exact figures.
      </p>

      <section className="section">
        <SectionHeader eyebrow="Competitive Landscape" title={`Where the ${area.short} field stands now`}
          meta={<SourceTag source={trials.source} accessDate={trials.accessDate} />} />
        <div className="card" style={{ padding: "18px 18px 14px" }}>
          <p className="clx__intro">
            Each program plotted by the furthest development phase it has reached — competitor assets only.
          </p>
          <CompetitiveLandscape programs={landscape} />
        </div>
        <div className="card" style={{ padding: "6px 18px 14px", marginTop: 16 }}>
          <CompetitiveProgressions indication={area.slug} initial={initialProgressions} />
        </div>
      </section>

      <section className="section">
        <SectionHeader eyebrow="Clinical Development" title="Trials by Phase"
          meta={<SourceTag source={trials.source} accessDate={trials.accessDate} />} />
        <div className="card" style={{ padding: "16px 12px" }}><PhaseBarChart data={phaseData} /></div>
      </section>

      <section className="section">
        <SectionHeader eyebrow="Competitive Landscape" title="Most Active Sponsors"
          meta={<span className="muted">Top {sponsorData.length} by trial count</span>} />
        <div className="card" style={{ padding: "16px 12px" }}><SponsorBarChart data={sponsorData} /></div>
      </section>

      <section className="section">
        <SectionHeader eyebrow="Clinical Development · Projected readouts" title="Upcoming projected readouts"
          meta={<SourceTag source={trials.source} accessDate={trials.accessDate} />} />
        <div className="card" style={{ padding: "6px 18px 14px" }}>
          <p className="clx__intro">Trials whose primary completion is an <em>estimated</em> (projected) future date — the next competitor readouts, with the endpoint each will report. Sorted soonest first.</p>
          {readouts.length ? (
            <div className="ro">
              {readouts.map((t) => (
                <div className="ro__row" key={t.id}>
                  <div className="ro__date">
                    <span className="ro__d">{formatDate(t.primaryCompletionDate)}</span>
                    <span className="ro__est">est.</span>
                  </div>
                  <div className="ro__body">
                    <a className="ro__title" href={t.url} target="_blank" rel="noreferrer">{t.title}</a>
                    <div className="ro__meta">{t.phase !== "NA" ? `${t.phase} · ` : ""}{t.sponsor} · <span className="mono">{t.id}</span></div>
                    {t.primaryEndpoint ? <div className="ro__ep"><span className="ro__eplabel">Primary endpoint:</span> {t.primaryEndpoint}</div> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="muted">No trials with a projected future primary-completion date in the current set.</p>}
        </div>
      </section>

      <section className="section">
        <SectionHeader eyebrow="Clinical Development · Change tracking" title="Recently updated trial records"
          meta={<SourceTag source={trials.source} accessDate={trials.accessDate} />} />
        <div className="card" style={{ padding: "6px 18px 14px" }}>
          <p className="clx__intro">The most recently changed records on ClinicalTrials.gov for {area.label}. Open any record&apos;s change history to see exactly what was edited and when.</p>
          {changed.length ? (
            <div className="chg">
              {changed.map((t) => (
                <div className="chg__row" key={t.id}>
                  <div className="chg__main">
                    <a className="chg__title" href={t.url} target="_blank" rel="noreferrer">{t.title}</a>
                    <div className="chg__meta">{t.phase !== "NA" ? `${t.phase} · ` : ""}{String(t.status).replace(/_/g, " ")} · {t.sponsor} · <span className="mono">{t.id}</span></div>
                  </div>
                  <div className="chg__aside">
                    <span className="chg__date">updated {formatDate(t.lastUpdate)}</span>
                    {t.historyUrl ? <a className="chg__hist" href={t.historyUrl} target="_blank" rel="noreferrer">View change history ↗</a> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="muted">No recent record updates in the current set.</p>}
        </div>
      </section>

      <div className="spacer-24" />
    </>
  );
}
