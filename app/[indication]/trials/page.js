import { notFound } from "next/navigation";
import { COMPANY, REVALIDATE_SECONDS, getIndication, listIndications } from "../../../lib/config";
import { getClinicalTrials } from "../../../lib/sources/clinicaltrials";
import { indicationsFromTrials } from "../../../lib/aggregate";
import { PageHeader, SourceTag, Callout } from "../../../components/ui";
import TrialsExplorer from "../../../components/TrialsExplorer";
import TrialCompare from "../../../components/TrialCompare";

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
  const indications = trials.ok ? indicationsFromTrials(trials.items, 12) : [];
  const indMax = Math.max(...indications.map((i) => i.count), 1);
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

      {indications.length ? (
        <section className="section">
          <div className="section__head">
            <div>
              <p className="section__eyebrow">Indications from clinical trials</p>
              <h2 className="section__title">What the field is actually studying</h2>
            </div>
            <div className="section__meta"><SourceTag source={trials.source} accessDate={trials.accessDate} /></div>
          </div>
          <div className="card" style={{ padding: "16px 18px" }}>
            <p className="clx__intro">Conditions listed across the live {area.label} trial set, by number of trials — the specific indications and sub-populations sponsors are pursuing.</p>
            <div className="indx">
              {indications.map((it) => (
                <div className="indx__row" key={it.condition}>
                  <span className="indx__label" title={it.condition}>{it.condition}</span>
                  <span className="indx__track"><span className="indx__fill" style={{ width: `${(it.count / indMax) * 100}%`, background: area.accent }} /></span>
                  <span className="indx__val">{it.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {trials.ok ? (
        <section className="section">
          <div className="section__head">
            <div>
              <p className="section__eyebrow">Design comparison</p>
              <h2 className="section__title">Compare trial design within a phase</h2>
            </div>
          </div>
          <TrialCompare trials={trials.items} />
        </section>
      ) : null}
      <div className="spacer-24" />
    </>
  );
}
