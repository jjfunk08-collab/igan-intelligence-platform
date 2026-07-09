import { COMPANY, REVALIDATE_SECONDS } from "../../lib/config";
import { getNews } from "../../lib/sources/news";
import { SectionHeader, SourceTag } from "../../components/ui";
import { timeAgo } from "../../lib/format";

export const revalidate = REVALIDATE_SECONDS;
export const metadata = { title: `News — ${COMPANY.product}` };

export default async function NewsPage() {
  const news = await getNews(40);
  return (
    <>
      <div className="spacer-24" />
      <a href="/" className="link-more">&larr; Back to the brief</a>
      <section className="section" style={{ marginTop: 12 }}>
        <SectionHeader
          eyebrow="Signal"
          title="News & Announcements"
          meta={<SourceTag source={news.source} accessDate={news.accessDate} />}
        />
        {!news.ok ? (
          <p className="notice notice--warn">Could not load news feeds ({news.error}).</p>
        ) : (
          <div className="card feed">
            {news.items.map((n) => (
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
