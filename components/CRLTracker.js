"use client";

import { useEffect, useMemo, useState } from "react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmt(v) {
  if (!v) return "date n/a";
  const d = new Date(String(v).length === 4 ? `${v}-01-01` : v);
  if (isNaN(d)) return String(v);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function resolvabilityColor(r) {
  const s = String(r || "").toLowerCase();
  if (s.includes("trial")) return "#b0304a";
  if (s.includes("procedural")) return "#3a7d18";
  return "#b5680a";
}

export default function CRLTracker({ letters = [], categories = [], total = null }) {
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);
  const PAGE = 15;
  const [shown, setShown] = useState(PAGE);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return letters.filter((l) => {
      const catOk = cat === "all" || (l.categoryKeys || []).includes(cat);
      const qOk = !query || `${l.company} ${l.application} ${l.excerpt}`.toLowerCase().includes(query);
      return catOk && qOk;
    });
  }, [letters, cat, q]);

  // Reset paging whenever the filter or search changes.
  useEffect(() => { setShown(PAGE); }, [cat, q]);

  const visible = filtered.slice(0, shown);

  return (
    <div className="crlt">
      <div className="crlt__controls">
        <div className="crlt__chips">
          <button className={`crlt__chip${cat === "all" ? " active" : ""}`} onClick={() => setCat("all")}>
            All ({letters.length})
          </button>
          {categories.map((c) => {
            const n = letters.filter((l) => (l.categoryKeys || []).includes(c.key)).length;
            if (!n) return null;
            return (
              <button key={c.key} className={`crlt__chip${cat === c.key ? " active" : ""}`} onClick={() => setCat(c.key)}>
                {c.label} ({n})
              </button>
            );
          })}
        </div>
        <input
          className="crlt__search"
          type="text"
          placeholder="Search company, application, or text…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <p className="crlt__count">
        Showing {Math.min(shown, filtered.length)} of {filtered.length} letters
        {typeof total === "number" ? ` · ${total.toLocaleString()} published in the full corpus` : ""}.
        Click any letter to zoom into its deficiency sections.
      </p>

      <div className="crlt__list">
        {visible.map((l) => {
          const open = openId === l.id;
          return (
            <div className={`crlt__row${open ? " open" : ""}`} key={l.id}>
              <button className="crlt__head" onClick={() => setOpenId(open ? null : l.id)} aria-expanded={open}>
                <div className="crlt__headmain">
                  <span className="crlt__co">{l.company}</span>
                  <span className="crlt__meta">{l.application || l.appType} · {fmt(l.date)}{l.center ? ` · ${l.center}` : ""}</span>
                </div>
                <div className="crlt__tags">
                  {(l.categories || []).slice(0, 3).map((c) => (
                    <span key={c.key} className="crlt__tag" style={{ borderColor: resolvabilityColor(c.resolvability), color: resolvabilityColor(c.resolvability) }}>
                      {c.label}
                    </span>
                  ))}
                  {!l.categories || l.categories.length === 0 ? <span className="crlt__tag crlt__tag--muted">Redacted</span> : null}
                  <span className="crlt__caret" aria-hidden="true">{open ? "\u2212" : "+"}</span>
                </div>
              </button>

              {open ? (
                <div className="crlt__body">
                  <div className="crlt__section">
                    <h4 className="crlt__h4">Main deficiencies cited</h4>
                    {l.sections && l.sections.length ? (
                      l.sections.map((s) => (
                        <div className="crlt__def" key={s.key}>
                          <div className="crlt__def-head">
                            <span className="crlt__def-dot" style={{ background: resolvabilityColor(s.resolvability) }} />
                            <span className="crlt__def-label">{s.label}</span>
                            <span className="crlt__def-res">{s.resolvability}</span>
                          </div>
                          <ul className="crlt__snips">
                            {s.snippets.map((sn, i) => <li key={i}>“{sn}”</li>)}
                          </ul>
                        </div>
                      ))
                    ) : (
                      <p className="muted">The specific deficiency language is redacted in the published letter. Use the link below to read the full document.</p>
                    )}
                  </div>

                  {l.excerpt ? (
                    <div className="crlt__section">
                      <h4 className="crlt__h4">Letter excerpt</h4>
                      <p className="crlt__excerpt">{l.excerpt}</p>
                    </div>
                  ) : null}

                  <div className="crlt__links">
                    <a href={l.fdaUrl} target="_blank" rel="noreferrer" className="crlt__link">View on Drugs@FDA ↗</a>
                    {l.pdfUrl ? <a href={l.pdfUrl} target="_blank" rel="noreferrer" className="crlt__link crlt__link--pdf">Open letter (PDF) ↗</a> : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
        {filtered.length === 0 ? <p className="muted" style={{ padding: "16px 4px" }}>No letters match that filter.</p> : null}
      </div>

      {filtered.length > shown ? (
        <button type="button" className="crlt__more" onClick={() => setShown((s) => s + PAGE)}>
          Show more letters ({filtered.length - shown} remaining) ▾
        </button>
      ) : null}
    </div>
  );
}
