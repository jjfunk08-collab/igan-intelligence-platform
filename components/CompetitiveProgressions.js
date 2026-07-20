"use client";

import { useCallback, useEffect, useState } from "react";
import { timeAgo } from "../lib/format";

const TAG_CLASS = {
  "Approval": "prog-tag--approval",
  "Regulatory filing": "prog-tag--filing",
  "Phase 3": "prog-tag--p3",
  "Topline data": "prog-tag--data",
  "Phase 2": "prog-tag--p2",
  "Trial start": "prog-tag--start",
  "Phase 1": "prog-tag--p1",
};

function sinceLabel(ts) {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

export default function CompetitiveProgressions({ indication, initial = [] }) {
  const [items, setItems] = useState(initial);
  const [updatedAt, setUpdatedAt] = useState(Date.now());
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const r = await fetch(`/api/${indication}/progressions`, { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        if (Array.isArray(d.items)) {
          setItems(d.items);
          setUpdatedAt(Date.now());
        }
      }
    } catch {
      /* keep last-known items on failure */
    } finally {
      setLoading(false);
    }
  }, [indication]);

  useEffect(() => {
    // If we were server-rendered with data, first client refresh happens on
    // the hourly tick; otherwise fetch immediately.
    if (!initial.length) load();
    const id = setInterval(load, 3600 * 1000); // every hour
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [load, initial.length]);

  return (
    <div className="prog">
      <div className="prog__head">
        <span className="prog__eyebrow">
          <span className={`prog__live${loading ? " is-loading" : ""}`} aria-hidden="true" />
          Recent progressions · other companies
        </span>
        <span className="prog__meta">Refreshes hourly · updated {sinceLabel(updatedAt)}</span>
      </div>

      {items.length ? (
        <ol className="prog__list">
          {items.map((n, i) => (
            <li className="prog__item" key={n.url || i}>
              <span className="prog__rank">{i + 1}</span>
              <div className="prog__body">
                <div className="prog__row1">
                  {n.tag ? (
                    <span className={`prog-tag ${TAG_CLASS[n.tag] || ""}`}>{n.tag}</span>
                  ) : null}
                  <a className="prog__title" href={n.url} target="_blank" rel="noreferrer">{n.title}</a>
                </div>
                <div className="prog__sub">
                  {n.outlet}{n.date ? ` · ${timeAgo(n.date)}` : ""}
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="muted" style={{ padding: "16px 4px" }}>
          No qualifying competitor progressions in the latest pull.
        </p>
      )}
    </div>
  );
}
