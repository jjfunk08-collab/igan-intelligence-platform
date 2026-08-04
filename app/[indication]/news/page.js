import { notFound } from "next/navigation";
import { COMPANY, REVALIDATE_SECONDS, getIndication, listIndications } from "../../../lib/config";
import { getNews } from "../../../lib/sources/news";
import { PageHeader, SourceTag, Callout } from "../../../components/ui";
import { timeAgo } from "../../../lib/format";

export const revalidate = REVALIDATE_SECONDS;
export function generateStaticParams() { return listIndications().map((i) => ({ indication: i.slug })); }
export function generateMetadata({ params }) {
  const a = getIndication(params.indication);
  return { title: a ? `${a.label} News — ${COMPANY.product}` : COMPANY.product };
}

export default async function NewsPage({ params }) {
  const area = getIndication(params.indication);
  if (!area) notFound();
  const news = await getNews(area, 40);
  return (
    <>
      <div className="spacer-24" />
      <PageHeader
        backHref={`/${area.slug}`}
        backLabel={`Back to the ${area.short} brief`}
        eyebrow="Signal"
        title={`${area.label} — News & Announcements`}
        meta={<SourceTag source={news.source} accessDate={news.accessDate} />}
      />
      {!news.ok ? (
        <Callout tone="warn" title="Couldn't load news">{news.error}</Callout>
      ) : (
        <div className="card feed">
          {news.items.map((n) => (
            <a className="feed__item feed__item--link" href={n.url} target="_blank" rel="noreferrer" key={n.id}>
              <div>
                <div className="feed__title">{n.title}</div>
                <div className="feed__meta">{n.outlet}</div>
              </div>
              <div className="feed__date">{n.date ? timeAgo(n.date) : ""}</div>
            </a>
          ))}
        </div>
      )}
      <div className="spacer-24" />
    </>
  );
}
