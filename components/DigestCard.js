// Presentational card for the newsletter cover. Pure server component.
export default function DigestCard({ accent = "#002a61", eyebrow, title, count, href, hrefLabel, children }) {
  return (
    <div className="dcard">
      <div className="dcard__accent" style={{ background: accent }} />
      <div className="dcard__inner">
        <div className="dcard__head">
          <div>
            <p className="dcard__eyebrow" style={{ color: accent }}>{eyebrow}</p>
            <h3 className="dcard__title">{title}</h3>
          </div>
          {count != null ? <span className="dcard__count">{count}</span> : null}
        </div>
        {children}
      </div>
      {href ? (
        <div className="dcard__foot">
          <a href={href} style={{ color: accent }}>{hrefLabel || "View all"} &rarr;</a>
        </div>
      ) : null}
    </div>
  );
}
