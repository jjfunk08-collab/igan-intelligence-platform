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

export default function CRLTracker({ letters = [], categories = [], diseases = [], total = null }) {
  const [cat, setCat] = useState("all");
  const [disease, setDisease] = useState("all");
  const [year, setYear] = useState("all");
  const [sort, setSort] = useState("newest");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);
  const [defOpen, setDefOpen] = useState({});
  const PAGE = 15;
  const [shown, setShown] = useState(PAGE);

  const years = useMemo(() => {
    const s = new Set(letters.map((l) => l.year).filter(Boolean));
    return [...s].sort((a, b) => b.localeCompare(a));
  }, [letters]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = letters.filter((l) => {
      const catOk = cat === "all" || (l.categoryKeys || []).includes(cat);
      const disOk = disease === "all" || (l.indications || []).includes(disease);
      const yrOk = year === "all" || l.year === year;
      const qOk = !query || `${l.company} ${l.application} ${l.excerpt}`.toLowerCase().includes(query);
      return catOk && disOk && yrOk && qOk;
    });
    list = list.slice().sort((a, b) => {
      const cmp = String(b.date || "").localeCompare(String(a.date || ""));
      return sort === "newest" ? cmp : -cmp;
    });
    return list;
  }, [letters, cat, disease, year, sort, q]);

  useEffect(() => { setShown(PAGE); }, [cat, disease, year, sort, q]);

  const visible = filtered.slice(0, shown);
  const activeCatDef = cat !== "all" ? categories.find((c) => c.key === cat) : null;
  const toggleDef = (rowId, key) => setDefOpen((m) => ({ ...m, [`${rowId}:${key}`]: !m[`${rowId}:${key}`] }));

  return (
    <div className="crlt">
      {diseases.length ? (
        <div className="crlt__filterline">
          <span className="crlt__filterlabel">Relevant disease</span>
          <div className="crlt__chips">
            <button className={`crlt__chip${disease === "all" ? " active" : ""}`} onClick={() => setDisease("all")}>All fields</button>
            {diseases.map((d) => (
              <button key={d.slug} className={`crlt__chip${disease === d.slug ? " active" : ""}`} onClick={() => setDisease(d.slug)} disabled={!d.count}>
                {d.label} ({d.count})
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="crlt__filterline">
        <span className="crlt__filterlabel">Deficiency</span>
        <div className="crlt__chips">
          <button className={`crlt__chip${cat === "all" ? " active" : ""}`} onClick={() => setCat("all")}>All ({letters.length})</button>
          {categories.map((c) => {
            const n = letters.filter((l) => (l.categoryKeys || []).includes(c.key)).length;
            if (!n) return null;
            return (
              <button key={c.key} className={`crlt__chip${cat === c.key ? " active" : ""}`} onClick={() => setCat(cat === c.key ? "all" : c.key)}>
                {c.label} ({n})
              </button>
            );
          })}
        </div>
      </div>

      {activeCatDef ? (
        <div className="crlt__def-panel" style={{ borderLeftColor: resolvabilityColor(activeCatDef.resolvability) }}>
          <div className="crlt__def-panel-head">
            <strong>{activeCatDef.label}</strong>
            <span className="crlt__def-panel-res" style={{ color: resolvabilityColor(activeCatDef.resolvability) }}>{activeCatDef.resolvability}</span>
          </div>
          <p>{activeCatDef.def}</p>
        </div>
      ) : null}

      <div className="crlt__controls">
        <input className="crlt__search" type="text" placeholder="Search company, application, or text…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="crlt__select" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="all">All years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="crlt__select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      <p className="crlt__count">
        Showing {Math.min(shown, filtered.length)} of {filtered.length} matching letters
        {typeof total === "number" ? ` · ${total.toLocaleString()} published in the full corpus` : ""}.
        Click a letter to zoom into its deficiency sections; click a deficiency to see what it means.
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
                    <span key={c.key} className="crlt__tag" style={{ borderColor: resolvabilityColor(c.resolvability), color: resolvabilityColor(c.resolvability) }}>{c.label}</span>
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
                      l.sections.map((s) => {
                        const isOpen = defOpen[`${l.id}:${s.key}`];
                        return (
                          <div className="crlt__def" key={s.key}>
                            <div className="crlt__def-head">
                              <span className="crlt__def-dot" style={{ background: resolvabilityColor(s.resolvability) }} />
                              <span className="crlt__def-label">{s.label}</span>
                              <span className="crlt__def-res">{s.resolvability}</span>
                              <button type="button" className="crlt__def-info" onClick={() => toggleDef(l.id, s.key)}>
                                {isOpen ? "hide" : "what's this?"}
                              </button>
                            </div>
                            {isOpen && s.def ? <p className="crlt__def-text">{s.def}</p> : null}
                            <ul className="crlt__snips">
                              {s.snippets.map((sn, i) => <li key={i}>“{sn}”</li>)}
                            </ul>
                          </div>
                        );
                      })
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
        {filtered.length === 0 ? <p className="muted" style={{ padding: "16px 4px" }}>No letters match those filters.</p> : null}
      </div>

      {filtered.length > shown ? (
        <button type="button" className="crlt__more" onClick={() => setShown((s) => s + PAGE)}>
          Show more letters ({filtered.length - shown} remaining) ▾
        </button>
      ) : null}
    </div>
  );
}
