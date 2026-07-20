"use client";

import { useMemo, useState } from "react";
import { formatDate } from "../lib/format";

const PHASE_OPTIONS = [
  { key: "PHASE3", label: "Phase 3" },
  { key: "PHASE2", label: "Phase 2" },
  { key: "PHASE1", label: "Phase 1" },
  { key: "PHASE4", label: "Phase 4" },
];

export default function TrialCompare({ trials }) {
  // Which phases actually have trials?
  const present = PHASE_OPTIONS.filter((p) =>
    trials.some((t) => String(t.phaseKey || t.phase).toUpperCase().includes(p.key))
  );
  const [phase, setPhase] = useState(present[0]?.key || "PHASE3");

  const rows = useMemo(() => {
    return trials
      .filter((t) => String(t.phaseKey || t.phase).toUpperCase().includes(phase))
      .sort((a, b) => (b.enrollment || 0) - (a.enrollment || 0))
      .slice(0, 30);
  }, [trials, phase]);

  if (present.length === 0) {
    return <p className="muted" style={{ fontSize: 13 }}>No phased trials available to compare.</p>;
  }

  return (
    <div>
      <div className="compare-tabs">
        {present.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`compare-tab${phase === p.key ? " active" : ""}`}
            onClick={() => setPhase(p.key)}
          >
            {p.label}
            <span className="compare-tab__n">
              {trials.filter((t) => String(t.phaseKey || t.phase).toUpperCase().includes(p.key)).length}
            </span>
          </button>
        ))}
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Trial &amp; sponsor</th>
              <th className="nowrap">Sample size</th>
              <th className="nowrap">Duration</th>
              <th>Primary endpoint</th>
              <th className="nowrap">Eligibility</th>
              <th className="nowrap">Links</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>
                  <div className="cell-title"><a href={t.url} target="_blank" rel="noreferrer">{t.title}</a></div>
                  <div className="mono muted">{t.id}{t.intervention ? ` · ${t.intervention}` : ""}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{t.sponsor}</div>
                </td>
                <td className="mono nowrap">{t.enrollment != null ? t.enrollment.toLocaleString() : "—"}</td>
                <td className="mono muted nowrap">
                  {t.durationMonths ? `${t.durationMonths} mo` : "—"}
                  {t.startDate ? <div style={{ fontSize: 11 }}>{formatDate(t.startDate)}</div> : null}
                </td>
                <td className="muted" style={{ maxWidth: 280 }}>{t.primaryEndpoint || "—"}</td>
                <td className="muted nowrap" style={{ fontSize: 12 }}>
                  {t.minAge || t.maxAge ? `${t.minAge || "—"}–${t.maxAge || "—"}` : "—"}
                  {t.sex && t.sex !== "ALL" ? <div>{t.sex.toLowerCase()}</div> : null}
                </td>
                <td className="nowrap">
                  <a href={t.url} target="_blank" rel="noreferrer" className="link-more">CT.gov</a>
                  {" · "}
                  <a href={t.pressUrl} target="_blank" rel="noreferrer" className="link-more">Press</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
        Design elements from ClinicalTrials.gov. Full inclusion/exclusion criteria are on each trial&rsquo;s CT.gov page.
        Showing up to 30 trials, largest first.
      </p>
    </div>
  );
}
