"use client";

import { useEffect, useState } from "react";
import { LANDSCAPE_STAGES } from "../../lib/aggregate";
import { EmptyNote } from "./EmptyNote";

// Phase colors reused from the phase bar chart for consistency.
const STAGE_COLOR = ["#4d4d4f", "#00a3da", "#0047bb", "#58bd2b"];

// Stable per-sponsor accent so the same company reads the same across rows.
const SPONSOR_PALETTE = ["#0047bb", "#00a3da", "#6d2077", "#3a7d18", "#b5680a", "#b0304a", "#0784ad", "#4d4d4f"];
function sponsorColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return SPONSOR_PALETTE[h % SPONSOR_PALETTE.length];
}

export default function CompetitiveLandscape({ programs = [] }) {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setLit(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!programs.length) return <EmptyNote />;

  return (
    <div className="clx">
      <div className="clx__axis">
        <div className="clx__axis-label">Program · Sponsor</div>
        <div className="clx__head">
          {LANDSCAPE_STAGES.map((s, i) => (
            <span key={s} className="clx__head-col" style={{ color: STAGE_COLOR[i] }}>{s}</span>
          ))}
        </div>
      </div>

      <div className="clx__rows">
        {programs.map((p, idx) => {
          const color = STAGE_COLOR[p.stage] || STAGE_COLOR[0];
          const fill = lit ? ((p.stage + 1) / 4) * 100 : 0;
          const markerLeft = ((p.stage + 0.5) / 4) * 100;
          const RowTag = p.url ? "a" : "div";
          return (
            <RowTag
              key={`${p.drug}-${p.sponsor}-${idx}`}
              className="clx__row"
              {...(p.url ? { href: p.url, target: "_blank", rel: "noreferrer" } : {})}
              title={`${p.drug} — ${p.sponsor}\n${p.stageLabel}${p.nct ? ` · ${p.nct}` : ""}${p.status ? ` · ${p.status}` : ""}`}
            >
              <div className="clx__prog">
                <span className="clx__sdot" style={{ background: sponsorColor(p.sponsor) }} aria-hidden="true" />
                <span className="clx__ptext">
                  <span className="clx__drug">{p.drug}</span>
                  <span className="clx__sponsor">{p.sponsor}</span>
                </span>
              </div>

              <div className="clx__track">
                <span className="clx__grid" aria-hidden="true"><i /><i /><i /></span>
                <span className="clx__fill" style={{ width: `${fill}%`, background: color }} />
                <span
                  className={`clx__marker${p.approved ? " is-approved" : ""}`}
                  style={{ left: `${markerLeft}%`, background: color, opacity: lit ? 1 : 0 }}
                >
                  {p.approved ? "\u2713" : ""}
                </span>
                <span className="clx__stagelbl" style={{ color }}>{p.stageLabel}</span>
              </div>
            </RowTag>
          );
        })}
      </div>

      <div className="clx__legend">
        {LANDSCAPE_STAGES.map((s, i) => (
          <span key={s} className="clx__legend-item">
            <span className="clx__legend-dot" style={{ background: STAGE_COLOR[i] }} />{s}
          </span>
        ))}
      </div>
    </div>
  );
}
