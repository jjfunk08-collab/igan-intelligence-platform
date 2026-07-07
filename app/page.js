import { AREA, REVALIDATE_SECONDS, DISCLAIMER } from "../lib/config";
import { getClinicalTrials } from "../lib/sources/clinicaltrials";
import { getApprovedTherapies } from "../lib/sources/openfda";
import { getPublications } from "../lib/sources/europepmc";
import { getNews } from "../lib/sources/news";
import { SectionHeader, SourceTag } from "../components/ui";
import TrialsExplorer from "../components/TrialsExplorer";
import { formatDate, timeAgo, truncate } from "../lib/format";

export const revalidate = REVALIDATE_SECONDS;

export default async function DashboardPage() {
  const [trials, therapies, pubs, news] = await Promise.all([
    getClinicalTrials(60),
    getApprovedTherapies(25),
    getPublications(24),
    getNews(20),
  ]);

  const recruitingCount = trials.items.filter(
    (t) => /RECRUITING/.test(String(t.status).toUpperCase()) && !/NOT/.test(String(t.status).toUpperCase())
  ).length;

  return (
    <>
      {/* KPI ribbon — real counts, not decoration */}
      <section className="kpis" aria-label="Landscape summary">
        <div className="kpi">
          <p className="kpi__label">Registered Trials</p>
          <div className="kpi__value">{fmtCount(trials.total)}</div>
          <p className="kpi__sub">{recruitingCount} recruiting in latest pull</p>
        </div>
        <div className="kpi">
          <p className="kpi__label">Approved Therapies</p>
          <div className="kpi__value">{fmtCount(therapies.items.length)}</div>
          <p className="kpi__sub">with IgAN in the FDA label</p>
        </div>
        <div className="kpi">
          <p className="kpi__label">Publications</p>
          <div className="kpi__value">{fmtCount(pubs.total)}</div>
          <p className="kpi__sub">indexed in Europe PMC</p>
        </div>
        <div className="kpi">
          <p className="kpi__label">Headlines</p>
          <div className="kpi__value">{fmtCount(news.items.length)}</div>
          <p className="kpi__sub">in the latest news pull</p>
        </div>
      </section>

      <p className="notice" style={{ marginTop: 14 }}>
        Tracking <strong>{AREA.label}</strong>. {DISCLAIMER}
      </p>

      {/* Clinical trials */}
      <section className="section">
        <SectionHeader
          eyebrow="Clinical Development"
          title="Trial Landscape"
          meta={
            <SourceTag source={trials.source} accessDate={trials.accessDate} />
          }
        />
        {trials.ok ? (
          <TrialsExplorer trials={trials.items} />
        ) : (
          <p className="notice notice--warn">
            Could not load trials right now ({trials.error}). Data refreshes on the
            next scheduled pull.
          </p>
        )}
      </section>

      {/* Approved therapies */}
      <section className="section">
        <SectionHeader
          eyebrow="Regulatory"
          title="Approved Therapies"
          meta={<SourceTag source={therapies.source} accessDate={therapies.accessDate} />}
        />
        {!therapies.ok ? (
          <p className="notice notice--warn">Could not load FDA labels ({therapies.error}).</p>
        ) : therapies.items.length === 0 ? (
          <p className="notice">No labeled products returned for this indication in the latest pull.</p>
        ) : (
          <div className="card table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Generic</th>
                  <th>Manufacturer</th>
                  <th>Indication (label excerpt)</th>
                  <th className="nowrap">Label date</th>
                </tr>
              </thead>
              <tbody>
                {therapies.items.map((d) => (
                  <tr key={d.id}>
                    <td className="cell-title">
                      <a href={d.url} target="_blank" rel="noreferrer">{d.brand}</a>
                    </td>
                    <td className="muted">{d.generic}</td>
                    <td className="muted">{d.manufacturer}</td>
                    <td className="muted">{truncate(d.indicationSnippet, 160)}</td>
                    <td className="mono muted nowrap">{formatDate(d.effectiveDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Publications */}
      <section className="section">
        <SectionHeader
          eyebrow="Evidence"
          title="Latest Publications & Preprints"
          meta={<SourceTag source={pubs.source} accessDate={pubs.accessDate} />}
        />
        {!pubs.ok ? (
          <p className="notice notice--warn">Could not load publications ({pubs.error}).</p>
        ) : (
          <div className="card feed">
            {pubs.items.slice(0, 12).map((p) => (
              <div className="feed__item" key={p.id}>
                <div>
                  <div className="feed__title">
                    <a href={p.url} target="_blank" rel="noreferrer">{p.title}</a>
                    {p.isPreprint ? <span className="badge badge--preprint" style={{ marginLeft: 8 }}>Preprint</span> : null}
                  </div>
                  <div className="feed__meta">
                    {truncate(p.authors, 120)}{p.journal ? ` — ${p.journal}` : ""}
                  </div>
                </div>
                <div className="feed__date">{formatDate(p.date)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* News */}
      <section className="section">
        <SectionHeader
          eyebrow="Signal"
          title="News & Announcements"
          meta={<SourceTag source={news.source} accessDate={news.accessDate} />}
        />
        {!news.ok ? (
          <p className="notice notice--warn">Could not load news feeds ({news.error}).</p>
        ) : (
          <div className="card feed">
            {news.items.slice(0, 12).map((n) => (
              <div className="feed__item" key={n.id}>
                <div>
                  <div className="feed__title">
                    <a href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
                  </div>
                  <div className="feed__meta">{n.outlet}</div>
                </div>
                <div className="feed__date">{n.date ? timeAgo(n.date) : ""}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="spacer-24" />
    </>
  );
}

function fmtCount(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString();
}
