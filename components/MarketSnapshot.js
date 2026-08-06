// "Market at a glance" — curated market context (value now + projection,
// population funnel, and top-5 drug sales). Renders only when an indication
// has a `market` block in config. Server component (static).

export default function MarketSnapshot({ market, label, accent = "#b5680a" }) {
  if (!market) return null;
  const sales = market.topSales || [];
  const maxSales = Math.max(...sales.map((s) => Number(s.value) || 0), 1);

  const cards = [];
  if (market.valueNow || market.valueProjected) {
    cards.push({
      value: `${market.valueNow || "—"} → ${market.valueProjected || "—"}`,
      label: `${market.valueNowLabel || "Market value"}${market.valueProjectedYear ? ` → ${market.valueProjectedYear}` : ""}`,
      source: market.valueSource,
      wide: true,
    });
  }
  for (const s of market.stats || []) cards.push(s);

  return (
    <section className="section">
      <div className="section__head">
        <div>
          <p className="section__eyebrow">Market Landscape</p>
          <h2 className="section__title">{label} market at a glance</h2>
        </div>
      </div>

      <div className="mkt-cards">
        {cards.map((c, i) => (
          <div className={`mkt-card${c.wide ? " mkt-card--wide" : ""}`} key={i} style={c.wide ? { borderTopColor: accent } : null}>
            <div className="mkt-card__value">{c.value}</div>
            <div className="mkt-card__label">{c.label}</div>
            {c.source ? <div className="mkt-card__src">{c.source}</div> : null}
          </div>
        ))}
      </div>

      {market.populations && market.populations.length ? (
        <>
          <h3 className="mkt-subtitle">Population funnel</h3>
          <div className="mkt-pops">
            {market.populations.map((p, i) => (
              <div className="mkt-pop" key={i}>
                <div className="mkt-pop__value" style={{ color: accent }}>{p.value}</div>
                <div className="mkt-pop__label">{p.label}</div>
                {p.source ? <div className="mkt-card__src">{p.source}</div> : null}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {sales.length ? (
        <>
          <h3 className="mkt-subtitle">{market.salesYear ? `${market.salesYear} ` : ""}sales by drug — top {sales.length}</h3>
          <div className="card" style={{ padding: "16px 18px" }}>
            <div className="mkt-sales">
              {sales.map((s, i) => (
                <div className="mkt-sales__row" key={i}>
                  <div className="mkt-sales__name">
                    <span className="mkt-sales__drug">{s.drug}</span>
                    <span className="mkt-sales__maker">{s.maker}{s.note ? ` · ${s.note}` : ""}</span>
                  </div>
                  <div className="mkt-sales__track">
                    <span className="mkt-sales__fill" style={{ width: `${(Number(s.value) / maxSales) * 100}%`, background: accent }} />
                  </div>
                  <div className="mkt-sales__val">{s.display}</div>
                </div>
              ))}
            </div>
            {market.salesNote ? <p className="crl-mix__note">{market.salesNote}</p> : null}
          </div>
        </>
      ) : null}

      {market.sourceNote ? <p className="crl-prov">{market.sourceNote}</p> : null}
    </section>
  );
}
