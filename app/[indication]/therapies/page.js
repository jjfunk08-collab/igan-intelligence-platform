import { notFound } from "next/navigation";
import { COMPANY, REVALIDATE_SECONDS, getIndication, listIndications } from "../../../lib/config";
import { getApprovedTherapies } from "../../../lib/sources/openfda";
import { SectionHeader, SourceTag } from "../../../components/ui";
import { formatDate } from "../../../lib/format";

export const revalidate = REVALIDATE_SECONDS;
export function generateStaticParams() { return listIndications().map((i) => ({ indication: i.slug })); }
export function generateMetadata({ params }) {
  const a = getIndication(params.indication);
  return { title: a ? `${a.label} Approvals — ${COMPANY.product}` : COMPANY.product };
}

export default async function TherapiesPage({ params }) {
  const area = getIndication(params.indication);
  if (!area) notFound();
  const therapies = await getApprovedTherapies(area);
  return (
    <>
      <div className="spacer-24" />
      <a href={`/${area.slug}`} className="link-more">&larr; Back to the {area.short} brief</a>
      <section className="section" style={{ marginTop: 12 }}>
        <SectionHeader eyebrow="Regulatory · Drugs@FDA" title={`${area.label} — Approved Therapies`}
          meta={<SourceTag source={therapies.source} accessDate={therapies.accessDate} />} />
        <p className="notice" style={{ marginBottom: 12 }}>
          Approval data is pulled live from <strong>Drugs@FDA</strong> (application number, sponsor,
          and first-approval date) where available.
          {therapies.curatedCount > 0
            ? ` ${therapies.liveCount} of ${therapies.total} matched Drugs@FDA; ${therapies.curatedCount} shown from a curated reference list (Drugs@FDA has not indexed them, or they predate the dataset). Those rows are marked "Curated".`
            : ""}
        </p>
        {!therapies.ok ? (
          <p className="notice notice--warn">Could not load approvals ({therapies.error}).</p>
        ) : (
          <div className="card table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Generic</th>
                  <th>Sponsor</th>
                  <th className="nowrap">First approval</th>
                  <th className="nowrap">Drugs@FDA #</th>
                  <th className="nowrap">Source</th>
                </tr>
              </thead>
              <tbody>
                {therapies.items.map((d) => (
                  <tr key={d.id}>
                    <td className="cell-title"><a href={d.url} target="_blank" rel="noreferrer">{d.brand}</a></td>
                    <td className="muted">{d.generic}</td>
                    <td className="muted">{d.manufacturer}</td>
                    <td className="mono muted nowrap">{formatDate(d.effectiveDate)}</td>
                    <td className="mono nowrap">
                      {d.applNo ? (
                        <a href={d.drugsFdaUrl} target="_blank" rel="noreferrer">{d.applNo}</a>
                      ) : <span className="muted">—</span>}
                    </td>
                    <td className="nowrap">
                      {d.live ? <span className="badge badge--recruiting">Live · Drugs@FDA</span>
                        : <span className="badge badge--preprint">Curated</span>}
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
