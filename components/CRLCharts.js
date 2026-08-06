import { getIndication } from "../lib/config";

// Presentational (server) charts for the CRL page — CSS bars, no client JS.

function ByYear({ data }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="crlc">
      <h3 className="crlc__title">Published letters by year</h3>
      <div className="crlc__bars">
        {data.map((d) => (
          <div className="crlc__barcol" key={d.year} title={`${d.year}: ${d.count}`}>
            <span className="crlc__barval">{d.count}</span>
            <span className="crlc__bar" style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }} />
            <span className="crlc__barlbl">{d.year}</span>
          </div>
        ))}
      </div>
      <p className="crlc__note">Reflects the FDA&apos;s rolling transparency releases (letters for since-approved applications), not every CRL ever issued.</p>
    </div>
  );
}

function Resolvability({ data }) {
  if (!data || !data.length) return null;
  const totalN = data.reduce((s, d) => s + d.count, 0) || 1;
  return (
    <div className="crlc">
      <h3 className="crlc__title">How hard are they to clear?</h3>
      <div className="crlc__stack">
        {data.map((d) => (
          <span key={d.key} className="crlc__stackseg" style={{ width: `${(d.count / totalN) * 100}%`, background: d.color }} title={`${d.label}: ${d.count}`} />
        ))}
      </div>
      <div className="crlc__legend">
        {data.map((d) => (
          <span className="crlc__legenditem" key={d.key}>
            <span className="crlc__legenddot" style={{ background: d.color }} />
            {d.label} — <strong>{Math.round((d.count / totalN) * 100)}%</strong>
          </span>
        ))}
      </div>
      <p className="crlc__note">By the strongest deficiency in each letter. The red slice is the dangerous one — it usually means another trial.</p>
    </div>
  );
}

function DiseaseCoverage({ data }) {
  const rows = (data || []).filter((d) => d.count > 0).sort((a, b) => b.count - a.count);
  if (!rows.length) return null;
  const max = Math.max(...rows.map((d) => d.count), 1);
  return (
    <div className="crlc">
      <h3 className="crlc__title">Letters touching our tracked diseases</h3>
      <div className="crlc__hbars">
        {rows.map((d) => {
          const area = getIndication(d.slug);
          const color = (area && area.accent) || "#0047bb";
          return (
            <div className="crlc__hrow" key={d.slug}>
              <span className="crlc__hlabel">{d.label}</span>
              <span className="crlc__htrack"><span className="crlc__hfill" style={{ width: `${(d.count / max) * 100}%`, background: color }} /></span>
              <span className="crlc__hval">{d.count}</span>
            </div>
          );
        })}
      </div>
      <p className="crlc__note">Letters whose company, drug, or text matches a program area on this site — use the &ldquo;Relevant disease&rdquo; filter below to read them.</p>
    </div>
  );
}

export default function CRLCharts({ byYear, resolvability, diseaseCounts }) {
  return (
    <div className="crlc-grid">
      <div className="card"><Resolvability data={resolvability} /></div>
      <div className="card"><ByYear data={byYear} /></div>
      <div className="card"><DiseaseCoverage data={diseaseCounts} /></div>
    </div>
  );
}
