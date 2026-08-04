import { notFound } from "next/navigation";
import { COMPANY, DISCLAIMER, REVALIDATE_SECONDS, SOURCES, getIndication, listIndications } from "../../../lib/config";
import { PageHeader, Callout } from "../../../components/ui";

export const revalidate = REVALIDATE_SECONDS;
export function generateStaticParams() { return listIndications().map((i) => ({ indication: i.slug })); }
export function generateMetadata({ params }) {
  const a = getIndication(params.indication);
  return { title: a ? `${a.label} Sources — ${COMPANY.product}` : COMPANY.product };
}

const STEPS = [
  { n: "01", t: "Pull", d: "Each section queries a public source directly — ClinicalTrials.gov, Drugs@FDA, Europe PMC, and news feeds." },
  { n: "02", t: "Cache", d: "Results are cached for 24 hours and refreshed by a daily job, so the tracker stays current with no manual updates." },
  { n: "03", t: "Attribute", d: "Every record links back to its origin and shows the date it was accessed. Nothing is unsourced." },
];

export default function SourcesPage({ params }) {
  const area = getIndication(params.indication);
  if (!area) notFound();

  return (
    <>
      <div className="spacer-24" />
      <PageHeader
        backHref={`/${area.slug}`}
        backLabel={`Back to the ${area.short} brief`}
        eyebrow="Methodology"
        title={`Sources & Method — ${area.label}`}
      />

      {/* How it works */}
      <div className="steps">
        {STEPS.map((s) => (
          <div className="step" key={s.n}>
            <span className="step__n">{s.n}</span>
            <h3 className="step__t">{s.t}</h3>
            <p className="step__d">{s.d}</p>
          </div>
        ))}
      </div>

      <div className="spacer-24" />
      <Callout tone="info" title="Query terms for this indication">
        <p>Trials are searched with <code>{area.condition}</code>. Literature is searched with <code>{area.literatureQuery}</code>. Adjusting these in one config entry re-scopes the whole tracker.</p>
      </Callout>

      <div style={{ height: 14 }} />
      <Callout tone="info" title="Approved therapies via Drugs@FDA">
        <p>
          Approval rows query <strong>Drugs@FDA</strong> (the openFDA <code>drugsfda.json</code> dataset) by brand
          name to retrieve the official FDA application number, sponsor, and first-approval date, each linked to its
          Drugs@FDA record. When Drugs@FDA has no match yet — common right after a new approval, or for older
          generics that predate the dataset — a curated reference row is shown and clearly marked
          &ldquo;Curated&rdquo;.
        </p>
      </Callout>

      {/* Source registry */}
      <section className="section">
        <p className="section__eyebrow" style={{ marginTop: 8 }}>Data sources</p>
        <h2 className="section__title" style={{ marginBottom: 14 }}>Where the data comes from</h2>
        <div className="srcgrid">
          {Object.values(SOURCES).map((s) => (
            <a className="srccard" href={s.home} target="_blank" rel="noreferrer" key={s.name}>
              <div className="srccard__name">{s.name}</div>
              <div className="srccard__attr">{s.attribution}</div>
              <dl className="srccard__meta">
                <div><dt>Auth</dt><dd>{s.auth}</dd></div>
                <div><dt>Refresh</dt><dd>{s.cadence}</dd></div>
              </dl>
              <span className="srccard__link">Open source &rarr;</span>
            </a>
          ))}
        </div>
      </section>

      <Callout tone="success" title="Compliance">
        <p>
          Public sources only. openFDA / Drugs@FDA exclude patient PII by design; trial and literature data are
          aggregate or bibliographic. No patient names or employee personal information are stored or displayed.
        </p>
        <p>{DISCLAIMER}</p>
      </Callout>
      <div className="spacer-24" />
    </>
  );
}
