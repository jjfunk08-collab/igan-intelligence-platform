import { COMPANY, REVALIDATE_SECONDS } from "../../lib/config";
import { getPublications } from "../../lib/sources/europepmc";
import { SectionHeader, SourceTag } from "../../components/ui";
import { formatDate, truncate } from "../../lib/format";

export const revalidate = REVALIDATE_SECONDS;
export const metadata = { title: `Literature — ${COMPANY.product}` };

export default async function PublicationsPage() {
  const pubs = await getPublications(40);
  return (
    <>
      <div className="spacer-24" />
      <a href="/" className="link-more">&larr; Back to the brief</a>
      <section className="section" style={{ marginTop: 12 }}>
        <SectionHeader
          eyebrow="Evidence"
          title="Publications & Preprints"
          meta={<SourceTag source={pubs.source} accessDate={pubs.accessDate} />}
        />
        {!pubs.ok ? (
          <p className="notice notice--warn">Could not load publications ({pubs.error}).</p>
        ) : (
          <div className="card feed">
            {pubs.items.map((p) => (
              <div className="feed__item" key={p.id}>
                <div>
                  <div className="feed__title">
                    <a href={p.url} target="_blank" rel="noreferrer">{p.title}</a>
                    {p.isPreprint ? <span className="badge badge--preprint" style={{ marginLeft: 8 }}>Preprint</span> : null}
                  </div>
                  <div className="feed__meta">
                    {truncate(p.authors, 130)}{p.journal ? ` — ${p.journal}` : ""}
                  </div>
                </div>
                <div className="feed__date">{formatDate(p.date)}</div>
              </div>
            ))}
          </div>
        )}
      </section>
      <div className="spacer-24" />
    </>
  );
}
