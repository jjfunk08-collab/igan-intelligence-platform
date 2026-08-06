"use client";

import { useState } from "react";

const CAT_COLOR = {
  clinical: "#b0304a", safety: "#b5680a", bioequiv: "#b5680a",
  cmc: "#3a7d18", facility: "#3a7d18", labeling: "#3a7d18", nonclinical: "#b5680a",
};

export default function CRLPlaybook({ items = [] }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="pbk">
      {items.map((p, i) => {
        const isOpen = open === i;
        const color = CAT_COLOR[p.cat] || "#0047bb";
        return (
          <div className={`pbk__row${isOpen ? " open" : ""}`} key={i}>
            <button className="pbk__head" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>
              <div className="pbk__cols">
                <div className="pbk__driver"><span className="pbk__x">✕</span>{p.driver}</div>
                <div className="pbk__fix"><span className="pbk__check">✓</span>{p.deRisker}</div>
              </div>
              <div className="pbk__aside">
                {p.frequency ? <span className="pbk__freq" style={{ borderColor: color, color }}>{p.frequency}</span> : null}
                <span className="pbk__caret" aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </div>
            </button>
            {isOpen ? (
              <div className="pbk__detail">
                <p>{p.detail}</p>
              </div>
            ) : null}
          </div>
        );
      })}
      <p className="pbk__hint">Click any row for how the failure actually happens and how to confirm you&apos;ve neutralized it.</p>
    </div>
  );
}
