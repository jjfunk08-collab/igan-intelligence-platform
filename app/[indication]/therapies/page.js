import { notFound } from "next/navigation";
import { COMPANY, REVALIDATE_SECONDS, getIndication, listIndications } from "../../../lib/config";
import { getApprovedTherapies } from "../../../lib/sources/openfda";
import { PageHeader, SourceTag, Callout, LegendKey } from "../../../components/ui";
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
      <PageHeader
        backHref={`/${area.slug}`}
        backLabel={`Back to the ${area.short} brief`}
        eyebrow="Regulatory · Drugs@FDA"
        title={`${area.label} — Approved Therapies`}
        meta={<SourceTag source={therapies.source} accessDate={therapies.accessDate} />}
      />

      <Callout tone="info" title="Live from Drugs@FDA">
        <p>
          Application numbers, sponsors, and first-approval dates are pulled live from Drugs@FDA where available
          {therapies.curatedCount > 0
            ? ` — ${therapies.liveCount} of ${therapies.total} matched. The remaining ${therapies.curatedCount} are shown from a curated reference list (not yet indexed, or predating the dataset).`
            : "."}
        </p>
      </Callout>

      <div style={{ height: 12 }} />
      <LegendKey
        items={[
          { badge: "Live · Drugs@FDA", cls: "badge--recruiting", label: "Matched to an official FDA application record" },
          { badge: "Curated", cls: "badge--preprint", label: "Reference entry pending Drugs@FDA indexing" },
        ]}
      />

      <div style={{ height: 14 }} />
      {!therapies.ok ? (
        <Callout tone="warn" title="Couldn't load approvals">{therapies.error}</Callout>
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
                    {d.applNo ? <a href={d.drugsFdaUrl} target="_blank" rel="noreferrer">{d.applNo}</a> : <span className="muted">—</span>}
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
      <div className="spacer-24" />
    </>
  );
}
