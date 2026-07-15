"use client";

import { useMemo, useState } from "react";
import { PhaseBadge, StatusBadge } from "./ui";
import { formatDate } from "../lib/format";

const PHASES = [
  { value: "", label: "All phases" },
  { value: "PHASE3", label: "Phase 3" },
  { value: "PHASE2", label: "Phase 2" },
  { value: "PHASE1", label: "Phase 1" },
  { value: "PHASE4", label: "Phase 4" },
];

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "RECRUITING", label: "Recruiting" },
  { value: "ACTIVE", label: "Active / enrolling" },
  { value: "COMPLETED", label: "Completed" },
  { value: "TERMINATED", label: "Terminated / withdrawn" },
];

export default function TrialsExplorer({ trials }) {
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState("");
  const [status, setStatus] = useState("");

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return trials.filter((t) => {
      if (phase && !String(t.phaseKey || t.phase).toUpperCase().includes(phase)) return false;
      if (status) {
        const s = String(t.status).toUpperCase();
        if (status === "ACTIVE" && !(s.includes("ACTIVE") || s.includes("ENROLLING"))) return false;
        if (status === "TERMINATED" && !(s.includes("TERMINATED") || s.includes("WITHDRAWN") || s.includes("SUSPENDED"))) return false;
        if (status === "RECRUITING" && !(s.includes("RECRUITING") && !s.includes("NOT"))) return false;
        if (status === "COMPLETED" && !s.includes("COMPLETED")) return false;
      }
      if (query) {
        const hay = `${t.title} ${t.sponsor} ${t.id}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [trials, q, phase, status]);

  return (
    <div className="card">
      <div className="filters">
        <input
          type="search"
          placeholder="Search title, sponsor, or NCT ID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search trials"
        />
        <select value={phase} onChange={(e) => setPhase(e.target.value)} aria-label="Filter by phase">
          {PHASES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <span className="filters__count">{rows.length} shown</span>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Trial</th>
              <th>Phase</th>
              <th>Status</th>
              <th>Sponsor</th>
              <th className="nowrap">Enroll.</th>
              <th className="nowrap">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted" style={{ padding: "24px 14px" }}>
                  No trials match these filters. Try clearing the search.
                </td>
              </tr>
            ) : (
              rows.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="cell-title">
                      <a href={t.url} target="_blank" rel="noreferrer">{t.title}</a>
                    </div>
                    <div className="mono muted">{t.id}</div>
                    <div style={{ marginTop: 3 }}>
                      <a href={t.url} target="_blank" rel="noreferrer" className="link-more">CT.gov ↗</a>
                      {" · "}
                      <a href={t.pressUrl} target="_blank" rel="noreferrer" className="link-more">Press ↗</a>
                    </div>
                  </td>
                  <td><PhaseBadge phase={t.phase} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="muted">{t.sponsor}</td>
                  <td className="mono nowrap">{t.enrollment ?? "—"}</td>
                  <td className="mono muted nowrap">{formatDate(t.lastUpdate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
