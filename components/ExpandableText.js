"use client";

import { useState } from "react";

export default function ExpandableText({ text, limit = 180, placeholder = "—" }) {
  const [open, setOpen] = useState(false);
  if (!text) return <span className="muted">{placeholder}</span>;

  const clean = String(text);
  const isLong = clean.length > limit;
  const cut = isLong ? clean.slice(0, clean.lastIndexOf(" ", limit)).trim() : clean;

  return (
    <span className="exp">
      <span className="exp__text">{open || !isLong ? clean : `${cut}… `}</span>
      {isLong ? (
        <button type="button" className="exp__btn" onClick={() => setOpen((o) => !o)}>
          {open ? "Show less" : "Show more"}
        </button>
      ) : null}
    </span>
  );
}
