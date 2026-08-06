"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { listIndications, getIndication } from "../lib/config";

const EXAMPLES = ["Phase 3 trials", "sparsentan", "recruiting", "latest approvals", "atrasentan"];

const BADGE_CLASS = {
  Trial: "badge--phase3",
  Approved: "badge--recruiting",
  Paper: "badge--phase2",
  Preprint: "badge--preprint",
  News: "badge--active",
};

export default function SearchAssistant() {
  const pathname = usePathname() || "/";
  const seg = pathname.split("/")[1] || "";
  const areaSlug = getIndication(seg) ? seg : listIndications()[0].slug;
  const areaLabel = getIndication(areaSlug)?.label || "";
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [ai, setAi] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced retrieval search.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAi(null);
    if (q.trim().length < 2) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?area=${areaSlug}&q=${encodeURIComponent(q)}`);
        const json = await res.json();
        setData(json);
      } catch {
        setData({ groups: [], total: 0 });
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [q, areaSlug]);

  // Close on outside click / Escape; "/" focuses the field.
  useEffect(() => {
    function onClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const askAi = useCallback(async () => {
    if (q.trim().length < 2) return;
    setAiLoading(true);
    setAi(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q, area: areaSlug }),
      });
      const json = await res.json();
      setAi(json);
    } catch {
      setAi({ enabled: true, answer: "", error: "Request failed" });
    } finally {
      setAiLoading(false);
    }
  }, [q, areaSlug]);

  const showPanel = open && (q.trim().length >= 1);

  return (
    <div className="search-band">
      <div className="container">
        <div className="search-wrap" ref={wrapRef}>
          <div className="search-input-row">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              className="search-input"
              type="search"
              placeholder={`Search ${areaLabel}: trials, approvals, literature, news — or ask a question…`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setOpen(true)}
              aria-label="Search the IgAN intelligence platform"
            />
            <span className="search-hint" aria-hidden="true">/</span>
          </div>

          {showPanel ? (
            <div className="search-panel">
              {q.trim().length < 2 ? (
                <div className="search-chips">
                  {EXAMPLES.map((ex) => (
                    <button key={ex} className="search-chip" onClick={() => setQ(ex)} type="button">
                      {ex}
                    </button>
                  ))}
                </div>
              ) : loading ? (
                <div className="search-empty">Searching…</div>
              ) : data && data.total > 0 ? (
                <>
                  {data.groups.map((g) => (
                    <div className="search-panel__group" key={g.key}>
                      <div className="search-group__label">{g.label}</div>
                      {g.items.map((it, i) => (
                        <a
                          className="search-result"
                          href={it.url}
                          target="_blank"
                          rel="noreferrer"
                          key={g.key + i}
                        >
                          <span className={`badge ${BADGE_CLASS[it.badge] || "badge--na"}`}>{it.badge}</span>
                          <span style={{ minWidth: 0 }}>
                            <span className="search-result__title">{it.title}</span>
                            <span className="search-result__sub">
                              {it.subtitle}{it.meta ? ` · ${it.meta}` : ""}
                            </span>
                          </span>
                        </a>
                      ))}
                    </div>
                  ))}

                  <div className="search-ai">
                    {!ai && !aiLoading ? (
                      <button className="btn btn--ghost" type="button" onClick={askAi}>
                        Ask AI to summarize these results
                      </button>
                    ) : null}
                    {aiLoading ? <div className="search-result__sub">Thinking…</div> : null}
                    {ai && ai.enabled === false ? (
                      <div className="search-ai__disclaimer">
                        AI answers aren&rsquo;t enabled. Add an <code>ANTHROPIC_API_KEY</code> in Vercel to turn this on.
                      </div>
                    ) : null}
                    {ai && ai.enabled && ai.answer ? (
                      <>
                        <div className="search-ai__answer">{ai.answer}</div>
                        <div className="search-ai__disclaimer">
                          AI-generated summary of the records above. Verify against the linked sources.
                          Not medical advice.
                        </div>
                      </>
                    ) : null}
                    {ai && ai.enabled && !ai.answer && ai.error ? (
                      <div className="search-ai__disclaimer">Couldn&rsquo;t generate a summary: {ai.error}</div>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="search-empty">
                  No matches for &ldquo;{q}&rdquo;. Try a drug name, phase, sponsor, or NCT ID.
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
