import { notFound } from "next/navigation";
import { COMPANY, REVALIDATE_SECONDS, getIndication, listIndications } from "../../../lib/config";
import { getClinicalTrials } from "../../../lib/sources/clinicaltrials";
import { getPublicationCountsByYear } from "../../../lib/sources/europepmc";
import { getNews } from "../../../lib/sources/news";
import { competitiveLandscape, scoreProgressions, topSponsorsDetailed, trialsByPhase, trialsByStatus } from "../../../lib/aggregate";
import { SectionHeader, SourceTag } from "../../../components/ui";
import PhaseBarChart from "../../../components/charts/PhaseBarChart";
import StatusDonut from "../../../components/charts/StatusDonut";
import SponsorBarChart from "../../../components/charts/SponsorBarChart";
import PublicationsLineChart from "../../../components/charts/PublicationsLineChart";
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
  const [trials, pubYears, news] = await Promise.all([
    getClinicalTrials(area),
    getPublicationCountsByYear(area, 6),
    getNews(area, 40),
  ]);
  const phaseData = trialsByPhase(trials.items);
  const statusData = trialsByStatus(trials.items);
  const sponsorData = topSponsorsDetailed(trials.items, 8);
  const landscape = competitiveLandscape(trials.items, area.knownApprovedTherapies || [], { limit: 14 });
  const initialProgressions = scoreProgressions(news.items, 3);

  return (
    <>
      <div className="spacer-24" />
      <a href={`/${area.slug}`} className="link-more">&larr; Back to the {area.short} brief</a>
      <p className="notice" style={{ marginTop: 12 }}>
        A quick visual read of the {area.label} landscape from the same daily-refreshed data. Hover any chart for exact figures.
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

      <div className="visuals-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
        <section className="section" style={{ margin: 0 }}>
          <SectionHeader eyebrow="Clinical Development" title="Trials by Phase"
            meta={<SourceTag source={trials.source} accessDate={trials.accessDate} />} />
          <div className="card" style={{ padding: "16px 12px" }}><PhaseBarChart data={phaseData} /></div>
        </section>
        <section className="section" style={{ margin: 0 }}>
          <SectionHeader eyebrow="Clinical Development" title="Trials by Status" />
          <div className="card" style={{ padding: "20px 16px" }}><StatusDonut data={statusData} /></div>
        </section>
      </div>

      <section className="section">
        <SectionHeader eyebrow="Competitive Landscape" title="Most Active Sponsors"
          meta={<span className="muted">Top {sponsorData.length} by trial count</span>} />
        <div className="card" style={{ padding: "16px 12px" }}><SponsorBarChart data={sponsorData} /></div>
      </section>

      <section className="section">
        <SectionHeader eyebrow="Evidence" title="Publication Volume by Year"
          meta={<SourceTag source={pubYears.source} accessDate={pubYears.accessDate} />} />
        <div className="card" style={{ padding: "16px 12px" }}><PublicationsLineChart data={pubYears.items} /></div>
      </section>
      <div className="spacer-24" />
    </>
  );
}
