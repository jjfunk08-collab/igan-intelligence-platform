import { AREA, COMPANY, REVALIDATE_SECONDS } from "../../lib/config";
import { getClinicalTrials } from "../../lib/sources/clinicaltrials";
import { getPublicationCountsByYear } from "../../lib/sources/europepmc";
import { topSponsors, trialsByPhase, trialsByStatus } from "../../lib/aggregate";
import { SectionHeader, SourceTag } from "../../components/ui";
import PhaseBarChart from "../../components/charts/PhaseBarChart";
import StatusDonut from "../../components/charts/StatusDonut";
import SponsorBarChart from "../../components/charts/SponsorBarChart";
import PublicationsLineChart from "../../components/charts/PublicationsLineChart";

export const revalidate = REVALIDATE_SECONDS;

export const metadata = {
  title: `Visuals — ${COMPANY.product}`,
};

export default async function VisualsPage() {
  const [trials, pubYears] = await Promise.all([
    getClinicalTrials(),
    getPublicationCountsByYear(6),
  ]);

  const phaseData = trialsByPhase(trials.items);
  const statusData = trialsByStatus(trials.items);
  const sponsorData = topSponsors(trials.items, 8);
  const pubYearData = pubYears.items;

  return (
    <>
      <div className="spacer-24" />
      <p className="notice">
        A quick visual read of the {AREA.label} landscape from the same daily-refreshed data
        as the dashboard. Hover any chart for exact figures — details and links live on the
        main dashboard.
      </p>

      <div className="visuals-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 28 }}>
        <section className="section" style={{ margin: 0 }}>
          <SectionHeader
            eyebrow="Clinical Development"
            title="Trials by Phase"
            meta={<SourceTag source={trials.source} accessDate={trials.accessDate} />}
          />
          <div className="card" style={{ padding: "16px 12px" }}>
            <PhaseBarChart data={phaseData} />
          </div>
        </section>

        <section className="section" style={{ margin: 0 }}>
          <SectionHeader eyebrow="Clinical Development" title="Trials by Status" />
          <div className="card" style={{ padding: "20px 16px" }}>
            <StatusDonut data={statusData} />
          </div>
        </section>
      </div>

      <section className="section">
        <SectionHeader
          eyebrow="Competitive Landscape"
          title="Most Active Sponsors"
          meta={<span className="muted">Top {sponsorData.length} by trial count</span>}
        />
        <div className="card" style={{ padding: "16px 12px" }}>
          <SponsorBarChart data={sponsorData} />
        </div>
      </section>

      <section className="section">
        <SectionHeader
          eyebrow="Evidence"
          title="Publication Volume by Year"
          meta={<SourceTag source={pubYears.source} accessDate={pubYears.accessDate} />}
        />
        <div className="card" style={{ padding: "16px 12px" }}>
          <PublicationsLineChart data={pubYearData} />
        </div>
      </section>

      <div className="spacer-24" />
    </>
  );
}
