// Compact, dependency-free stacked bar showing trial phase mix.
const COLORS = {
  "Phase 1": "#4d4d4f",
  "Phase 2": "#00a3da",
  "Phase 3": "#0047bb",
  "Phase 4": "#6d2077",
  "N/A": "#a8b3c3",
};

export default function StackedPhaseBar({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return <p className="muted" style={{ fontSize: 12 }}>No phase data available.</p>;

  return (
    <div>
      <div className="stackbar" role="img" aria-label="Trial phase distribution">
        {data.map((d) => (
          <div
            key={d.key || d.label}
            className="stackbar__seg"
            style={{ width: `${(d.count / total) * 100}%`, background: COLORS[d.label] || "#0047bb" }}
            title={`${d.label}: ${d.count}`}
          />
        ))}
      </div>
      <div className="stackbar__legend">
        {data.map((d) => (
          <span className="stackbar__key" key={(d.key || d.label) + "-k"}>
            <span className="stackbar__swatch" style={{ background: COLORS[d.label] || "#0047bb" }} />
            {d.label} <strong>{d.count}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
