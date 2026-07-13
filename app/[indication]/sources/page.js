import { notFound } from "next/navigation";
import { COMPANY, DISCLAIMER, REVALIDATE_SECONDS, SOURCES, getIndication, listIndications } from "../../../lib/config";

export const revalidate = REVALIDATE_SECONDS;
export function generateStaticParams() { return listIndications().map((i) => ({ indication: i.slug })); }
export function generateMetadata({ params }) {
  const a = getIndication(params.indication);
  return { title: a ? `${a.label} Sources — ${COMPANY.product}` : COMPANY.product };
}

export default function SourcesPage({ params }) {
  const area = getIndication(params.indication);
  if (!area) notFound();
  return (
    <div className="prose">
      <div className="spacer-24" />
      <a href={`/${area.slug}`} className="link-more">&larr; Back to the {area.short} brief</a>
      <h1 style={{ fontFamily: "var(--font-display)", color: "var(--navy)", margin: "12px 0 6px" }}>
        Sources &amp; Method — {area.label}
      </h1>
      <p className="muted" style={{ marginTop: 0 }}>Developed by {COMPANY.developer} for {COMPANY.legalName}.</p>

      <h2>How this tracker works</h2>
      <p>
        Each section pulls live from a public source and caches the result for 24 hours
        (Vercel&rsquo;s incremental static regeneration). A daily job refreshes the cache so the
        tracker stays current without a separate database. Every record links back to its origin
        and carries the date it was accessed. Query terms for this indication:{" "}
        trials use <code>{area.condition}</code>; literature uses <code>{area.literatureQuery}</code>.
      </p>

      <h2>Approved therapies via Drugs@FDA</h2>
      <p>
        Approval rows query <strong>Drugs@FDA</strong> (the openFDA <code>drugsfda.json</code> dataset)
        by brand name to retrieve the official FDA application number, sponsor, and first-approval date,
        each linked to its Drugs@FDA record. When Drugs@FDA has no match yet (common right after a new
        approval, or for older generics that predate the dataset), a curated reference row is shown and
        clearly marked &ldquo;Curated&rdquo;.
      </p>

      <h2>Data sources</h2>
      <div className="srclist">
        {Object.values(SOURCES).map((s) => (
          <div className="card" style={{ padding: "14px 16px" }} key={s.name}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--navy)" }}>{s.name}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{s.attribution}</div>
            <div style={{ fontSize: 13, marginTop: 8, display: "grid", gap: 3 }}>
              <div><span className="mono muted">HOME</span>{"  "}<a href={s.home} target="_blank" rel="noreferrer">{s.home}</a></div>
              <div><span className="mono muted">API {" "}</span>{"  "}<a href={s.api} target="_blank" rel="noreferrer">{s.api}</a></div>
              <div><span className="mono muted">AUTH</span>{"  "}{s.auth}</div>
              <div><span className="mono muted">FRESH</span>{"  "}{s.cadence}</div>
            </div>
          </div>
        ))}
      </div>

      <h2>Compliance</h2>
      <p>
        Public sources only. openFDA/Drugs@FDA exclude patient PII by design; trial and literature data
        are aggregate or bibliographic. No patient names or employee personal information are stored or
        displayed. {DISCLAIMER}
      </p>
      <div className="spacer-24" />
    </div>
  );
}
