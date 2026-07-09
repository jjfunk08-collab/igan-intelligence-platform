import { COMPANY, REVALIDATE_SECONDS } from "../../lib/config";
import { getApprovedTherapies } from "../../lib/sources/openfda";
import { SectionHeader, SourceTag } from "../../components/ui";
import { formatDate, truncate } from "../../lib/format";

export const revalidate = REVALIDATE_SECONDS;
export const metadata = { title: `Approved Therapies — ${COMPANY.product}` };

export default async function TherapiesPage() {
  const therapies = await getApprovedTherapies();
  return (
    <>
      <div className="spacer-24" />
      <a href="/" className="link-more">&larr; Back to the brief</a>
      <section className="section" style={{ marginTop: 12 }}>
        <SectionHeader
          eyebrow="Regulatory"
          title="Approved Therapies"
          meta={<SourceTag source={therapies.source} accessDate={therapies.accessDate} />}
        />
        {therapies.curatedCount > 0 ? (
          <p className="notice" style={{ marginBottom: 12 }}>
            {therapies.liveCount} of {therapies.total} confirmed live from openFDA;{" "}
            {therapies.curatedCount} shown from a curated reference list because openFDA has not
            yet indexed that label (common in the days after a new approval). Curated rows are
            marked below and link to the original announcement.
          </p>
        ) : null}
        {!therapies.ok ? (
          <p className="notice notice--warn">Could not load FDA labels ({therapies.error}).</p>
        ) : (
          <div className="card table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Generic</th>
                  <th>Manufacturer</th>
                  <th>Indication (label excerpt)</th>
                  <th className="nowrap">Approved / Label date</th>
                  <th className="nowrap">Source</th>
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
                    <td className="nowrap">
                      {d.curated ? (
                        <span className="badge badge--preprint">Curated</span>
                      ) : (
                        <span className="badge badge--recruiting">Live · openFDA</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="spacer-24" />
    </>
  );
}
