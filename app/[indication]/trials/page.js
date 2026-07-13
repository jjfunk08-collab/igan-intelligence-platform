import { notFound } from "next/navigation";
import { COMPANY, REVALIDATE_SECONDS, getIndication, listIndications } from "../../../lib/config";
import { getClinicalTrials } from "../../../lib/sources/clinicaltrials";
import { SectionHeader, SourceTag } from "../../../components/ui";
import TrialsExplorer from "../../../components/TrialsExplorer";

export const revalidate = REVALIDATE_SECONDS;
export function generateStaticParams() { return listIndications().map((i) => ({ indication: i.slug })); }
export function generateMetadata({ params }) {
  const a = getIndication(params.indication);
  return { title: a ? `${a.label} Trials — ${COMPANY.product}` : COMPANY.product };
}

export default async function TrialsPage({ params }) {
  const area = getIndication(params.indication);
  if (!area) notFound();
  const trials = await getClinicalTrials(area);
  return (
    <>
      <div className="spacer-24" />
      <a href={`/${area.slug}`} className="link-more">&larr; Back to the {area.short} brief</a>
      <section className="section" style={{ marginTop: 12 }}>
        <SectionHeader eyebrow="Clinical Development" title={`${area.label} — Trial Landscape`}
          meta={<SourceTag source={trials.source} accessDate={trials.accessDate} />} />
        {trials.ok ? <TrialsExplorer trials={trials.items} />
          : <p className="notice notice--warn">Could not load trials right now ({trials.error}).</p>}
      </section>
      <div className="spacer-24" />
    </>
  );
}
