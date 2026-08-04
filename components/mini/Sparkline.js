// Dependency-free inline SVG sparkline. Expects [{year, count}, ...].
export default function Sparkline({ points }) {
  const vals = points.map((p) => p.count);
  const max = Math.max(1, ...vals);
  const n = points.length;

  if (n < 2) {
    return <p className="muted" style={{ fontSize: 12 }}>Not enough data to chart a trend.</p>;
  }

  const W = 100;
  const H = 32;
  const stepX = W / (n - 1);
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = H - (p.count / max) * (H - 4) - 2;
    return [x, y];
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const lastYear = points[n - 1];
  const total = vals.reduce((s, v) => s + v, 0);

  return (
    <div className="spark-wrap">
      <div className="spark-wrap__stat">
        <div className="n">{total.toLocaleString()}</div>
        <div className="l">last {n} yrs</div>
      </div>
      <div style={{ flex: 1 }}>
        <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label="Publication volume trend">
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#58bd2b" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#58bd2b" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#sparkFill)" />
          <path d={line} fill="none" stroke="#3a7d18" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--ink-muted)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
          <span>{points[0].year}</span>
          <span>{lastYear.year}</span>
        </div>
      </div>
    </div>
  );
}
