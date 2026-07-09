import { COMPANY, DISCLAIMER, REVALIDATE_SECONDS, SOURCES } from "../../lib/config";

export const revalidate = REVALIDATE_SECONDS;

export const metadata = {
  title: `Sources & Method — ${COMPANY.product}`,
};

export default function SourcesPage() {
  return (
    <div className="prose">
      <div className="spacer-24" />
      <h1 style={{ fontFamily: "var(--font-display)", color: "var(--navy)", margin: "0 0 6px" }}>
        Sources &amp; Method
      </h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Developed by {COMPANY.developer} for {COMPANY.legalName}.
      </p>

      <h2>How this platform works</h2>
      <p>
        Every section pulls live from a public source and caches the result for 24 hours
        (Vercel&rsquo;s incremental static regeneration). A daily scheduled job refreshes the
        cache so the dashboard stays current without a separate database. Each record links
        back to its origin and carries the date it was accessed.
      </p>

      <h2>Data sources</h2>
      <div className="srclist">
        {Object.values(SOURCES).map((s) => (
          <div className="card" style={{ padding: "14px 16px" }} key={s.name}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--navy)" }}>
              {s.name}
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{s.attribution}</div>
            <div style={{ fontSize: 13, marginTop: 8, display: "grid", gap: 3 }}>
              <div><span className="mono muted">HOME</span>{"  "}<a href={s.home} target="_blank" rel="noreferrer">{s.home}</a></div>
              <div><span className="mono muted">API {" "}</span>{"  "}<a href={s.api} target="_blank" rel="noreferrer">{s.api}</a></div>
              <div><span className="mono muted">AUTH</span>{"  "}{s.auth}</div>
              <div><span className="mono muted">FRESH</span>{"  "}{s.cadence}</div>
              <div><span className="mono muted">TERMS</span>{"  "}<a href={s.terms} target="_blank" rel="noreferrer">{s.terms}</a></div>
            </div>
          </div>
        ))}
      </div>

      <h2>Approved therapies: live data with a curated safety net</h2>
      <p>
        Approved-therapy rows are fetched from openFDA by querying each known brand name
        directly, which is far more reliable than a free-text search of label paragraphs
        (label formatting varies across manufacturers, and some use structured tables that a
        phrase search can miss entirely). If openFDA has not yet indexed a given label &mdash;
        common in the days immediately after a new approval &mdash; that row falls back to a
        curated reference entry instead of showing nothing. Curated rows are visibly marked
        and link to the original approval announcement; live rows are marked and link to the
        current label on DailyMed. The curated list is reviewed and updated as new therapies
        are approved.
      </p>

      <h2>Compliance notes</h2>
      <p>
        None of these sources expose patient names: openFDA explicitly excludes personally
        identifiable information, and ClinicalTrials.gov and Europe PMC data are aggregate or
        bibliographic. No employee personal information is stored or displayed. Records are
        cached transiently and always attributed to their origin.
      </p>

      <h2>Scope</h2>
      <p>{DISCLAIMER}</p>

      <div className="spacer-24" />
    </div>
  );
}
