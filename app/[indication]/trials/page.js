import { notFound } from "next/navigation";
import { COMPANY, REVALIDATE_SECONDS, getIndication, listIndications } from "../../../lib/config";
import { getClinicalTrials } from "../../../lib/sources/clinicaltrials";
import { PageHeader, SourceTag, Callout } from "../../../components/ui";
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
      <PageHeader
        backHref={`/${area.slug}`}
        backLabel={`Back to the ${area.short} brief`}
        eyebrow="Clinical Development"
        title={`${area.label} — Trial Landscape`}
        meta={<SourceTag source={trials.source} accessDate={trials.accessDate} />}
      />
      {trials.ok ? <TrialsExplorer trials={trials.items} />
        : <Callout tone="warn" title="Couldn't load trials">{trials.error}</Callout>}
      <div className="spacer-24" />
    </>
  );
}
