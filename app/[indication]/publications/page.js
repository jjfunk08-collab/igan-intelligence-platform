import { notFound } from "next/navigation";
import { COMPANY, REVALIDATE_SECONDS, getIndication, listIndications } from "../../../lib/config";
import { getPublications } from "../../../lib/sources/europepmc";
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
  const pubs = await getPublications(area, 40);
  return (
    <>
      <div className="spacer-24" />
      <PageHeader
        backHref={`/${area.slug}`}
        backLabel={`Back to the ${area.short} brief`}
        eyebrow="Evidence"
        title={`${area.label} — Publications & Preprints`}
        meta={<SourceTag source={pubs.source} accessDate={pubs.accessDate} />}
      />
      {!pubs.ok ? (
        <Callout tone="warn" title="Couldn't load publications">{pubs.error}</Callout>
      ) : (
        <div className="card feed">
          {pubs.items.map((p) => (
            <div className="feed__item" key={p.id}>
              <div>
                <div className="feed__title">
                  <a href={p.url} target="_blank" rel="noreferrer">{p.title}</a>
                  {p.isPreprint ? <span className="badge badge--preprint" style={{ marginLeft: 8 }}>Preprint</span> : null}
                </div>
                <div className="feed__meta">{truncate(p.authors, 130)}{p.journal ? ` — ${p.journal}` : ""}</div>
              </div>
              <div className="feed__date">{formatDate(p.date)}</div>
            </div>
          ))}
        </div>
      )}
      <div className="spacer-24" />
    </>
  );
}
