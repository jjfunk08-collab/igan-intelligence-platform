import { notFound } from "next/navigation";
import { COMPANY, REVALIDATE_SECONDS, getIndication, listIndications } from "../../../lib/config";
import { getRecentPublications } from "../../../lib/sources/europepmc";
import { PageHeader, SourceTag, Callout } from "../../../components/ui";
import { formatDate, truncate } from "../../../lib/format";

export const revalidate = REVALIDATE_SECONDS;
export function generateStaticParams() { return listIndications().map((i) => ({ indication: i.slug })); }
export function generateMetadata({ params }) {
  const a = getIndication(params.indication);
  return { title: a ? `${a.label} Literature — ${COMPANY.product}` : COMPANY.product };
}

export default async function PublicationsPage({ params }) {
  const area = getIndication(params.indication);
  if (!area) notFound();
  const pubs = await getRecentPublications(area, 6, 60);

  return (
    <>
      <div className="spacer-24" />
      <PageHeader
        backHref={`/${area.slug}`}
        backLabel={`Back to the ${area.short} brief`}
        eyebrow="Evidence · Last 6 months"
        title={`${area.label} — Recent Publications`}
        meta={<SourceTag source={pubs.source} accessDate={pubs.accessDate} />}
      />

      <Callout tone="info" title="Scoped to the last 6 months">
        <p>
          Showing peer-reviewed papers and preprints first published in the last six months
          {pubs.total != null ? ` — ${Number(pubs.total).toLocaleString()} found` : ""}, newest first.
          Each links to its source.
        </p>
      </Callout>
      <div style={{ height: 14 }} />

      {!pubs.ok ? (
        <Callout tone="warn" title="Couldn't load publications">{pubs.error}</Callout>
      ) : pubs.items.length === 0 ? (
        <Callout tone="muted">No publications in the last six months for this indication.</Callout>
      ) : (
        <div className="card feed">
          {pubs.items.map((p) => (
            <a className="feed__item feed__item--link" href={p.url} target="_blank" rel="noreferrer" key={p.id}>
              <div>
                <div className="feed__title">
                  {p.title}
                  {p.isPreprint ? <span className="badge badge--preprint" style={{ marginLeft: 8 }}>Preprint</span> : null}
                </div>
                <div className="feed__meta">{truncate(p.authors, 130)}{p.journal ? ` — ${p.journal}` : ""}</div>
              </div>
              <div className="feed__date">{formatDate(p.date)}</div>
            </a>
          ))}
        </div>
      )}
      <div className="spacer-24" />
    </>
  );
}
