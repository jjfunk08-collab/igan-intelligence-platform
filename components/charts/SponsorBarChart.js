"use client";

import { useEffect, useState } from "react";
import { EmptyNote } from "./EmptyNote";

// Phase palette consistent with the rest of the analytics views.
const PHASE_SEGMENTS = [
  { key: "PHASE1", label: "Phase 1", color: "#4d4d4f" },
  { key: "PHASE2", label: "Phase 2", color: "#00a3da" },
  { key: "PHASE3", label: "Phase 3", color: "#0047bb" },
  { key: "PHASE4", label: "Phase 4", color: "#6d2077" },
  { key: "NA", label: "N/A", color: "#c3ccda" },
];

const LEAD_CLASS = {
  "Phase 1": "badge--phase1",
  "Phase 2": "badge--phase2",
  "Phase 3": "badge--phase3",
  "Phase 4": "badge--phase4",
};

export default function SponsorBarChart({ data }) {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setLit(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!data || !data.length) return <EmptyNote />;

  // Backward-compatible: if given the old {sponsor,count} shape, synthesize a
  // single-segment breakdown so the component still renders.
  const rows = data.map((d) =>
    d.phases ? d : { ...d, phases: { NA: d.count }, recruiting: 0, leadPhaseLabel: null }
  );
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="spx">
      <div className="spx__rows">
        {rows.map((r, idx) => (
          <div className="spx__row" key={r.sponsor}>
            <div className="spx__label" title={r.sponsor}>
              <span className="spx__rank">{idx + 1}</span>
              <span className="spx__name">{r.sponsor}</span>
            </div>

            <div className="spx__barwrap">
              <div className="spx__bar" style={{ width: lit ? `${(r.count / max) * 100}%` : "0%" }}>
                {PHASE_SEGMENTS.map((seg) => {
                  const n = r.phases[seg.key] || 0;
                  if (!n) return null;
                  return (
                    <span
                      key={seg.key}
                      className="spx__seg"
                      style={{ flexGrow: n, background: seg.color }}
                      title={`${seg.label}: ${n} trial${n === 1 ? "" : "s"}`}
                    />
                  );
                })}
              </div>
              <span className="spx__total">{r.count}</span>
            </div>

            <div className="spx__meta">
              {r.leadPhaseLabel && r.leadPhaseLabel !== "—" ? (
                <span className={`badge ${LEAD_CLASS[r.leadPhaseLabel] || "badge--na"}`}>
                  Lead: {r.leadPhaseLabel}
                </span>
              ) : null}
              {r.recruiting ? (
                <span className="spx__recruit">
                  <span className="spx__recruit-dot" />{r.recruiting} recruiting
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="spx__legend">
        {PHASE_SEGMENTS.map((seg) => (
          <span key={seg.key} className="spx__legend-item">
            <span className="spx__legend-dot" style={{ background: seg.color }} />{seg.label}
          </span>
        ))}
      </div>
    </div>
  );
}
