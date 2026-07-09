import { COMPANY, REVALIDATE_SECONDS } from "../../lib/config";
import { getClinicalTrials } from "../../lib/sources/clinicaltrials";
import { SectionHeader, SourceTag } from "../../components/ui";
import TrialsExplorer from "../../components/TrialsExplorer";

export const revalidate = REVALIDATE_SECONDS;
export const metadata = { title: `Trials — ${COMPANY.product}` };

export default async function TrialsPage() {
  const trials = await getClinicalTrials();
  return (
    <>
      <div className="spacer-24" />
      <a href="/" className="link-more">&larr; Back to the brief</a>
      <section className="section" style={{ marginTop: 12 }}>
        <SectionHeader
          eyebrow="Clinical Development"
          title="Trial Landscape"
          meta={<SourceTag source={trials.source} accessDate={trials.accessDate} />}
        />
        {trials.ok ? (
          <TrialsExplorer trials={trials.items} />
        ) : (
          <p className="notice notice--warn">Could not load trials right now ({trials.error}).</p>
        )}
      </section>
      <div className="spacer-24" />
    </>
  );
}
