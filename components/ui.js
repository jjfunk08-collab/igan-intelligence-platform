import { accessLabel } from "../lib/format";

export function SectionHeader({ eyebrow, title, meta }) {
  return (
    <div className="section__head">
      <div>
        <p className="section__eyebrow">{eyebrow}</p>
        <h2 className="section__title">{title}</h2>
      </div>
      {meta ? <div className="section__meta">{meta}</div> : null}
    </div>
  );
}

export function SourceTag({ source, accessDate }) {
  if (!source) return null;
  return (
    <span className="srctag">
      <span className="srctag__dot" aria-hidden="true" />
      Source:{" "}
      <a href={source.home} target="_blank" rel="noreferrer">
        {source.name}
      </a>
      {source.attribution ? <span className="muted">· {source.attribution}</span> : null}
      {accessDate ? <span className="muted">· {accessLabel(accessDate)}</span> : null}
    </span>
  );
}

export function PhaseBadge({ phase }) {
  const key = String(phase || "NA").toUpperCase();
  let cls = "badge--na";
  if (key.includes("PHASE4")) cls = "badge--phase4";
  else if (key.includes("PHASE3")) cls = "badge--phase3";
  else if (key.includes("PHASE2")) cls = "badge--phase2";
  else if (key.includes("PHASE1") || key.includes("EARLY")) cls = "badge--phase1";
  const label = key
    .replace(/PHASE/g, "P")
    .replace(/EARLY_?P1/g, "Early P1")
    .replace(/_/g, " ")
    .replace(/\s*\/\s*/g, "/");
  return <span className={`badge ${cls}`}>{label === "NA" ? "N/A" : label}</span>;
}

export function StatusBadge({ status }) {
  const s = String(status || "").toUpperCase();
  let cls = "badge--completed";
  if (s.includes("RECRUITING") && !s.includes("NOT")) cls = "badge--recruiting";
  else if (s === "NOT_YET_RECRUITING") cls = "badge--active";
  else if (s.includes("ACTIVE") || s.includes("ENROLLING")) cls = "badge--active";
  else if (s.includes("COMPLETED")) cls = "badge--completed";
  else if (s.includes("TERMINATED") || s.includes("WITHDRAWN") || s.includes("SUSPENDED"))
    cls = "badge--stopped";
  const label = s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return <span className={`badge ${cls}`}>{label || "Unknown"}</span>;
}

export function PageHeader({ backHref, backLabel, eyebrow, title, meta }) {
  return (
    <div className="pagehead">
      {backHref ? (
        <a href={backHref} className="pagehead__back">&larr; {backLabel || "Back"}</a>
      ) : null}
      <div className="pagehead__row">
        <div style={{ minWidth: 0 }}>
          {eyebrow ? <p className="pagehead__eyebrow">{eyebrow}</p> : null}
          <h1 className="pagehead__title">{title}</h1>
        </div>
        {meta ? <div className="pagehead__meta">{meta}</div> : null}
      </div>
    </div>
  );
}

export function Callout({ tone = "info", title, children }) {
  const glyph = tone === "warn" ? "!" : tone === "success" ? "\u2713" : "i";
  return (
    <div className={`callout callout--${tone}`}>
      <span className="callout__icon" aria-hidden="true">{glyph}</span>
      <div className="callout__body">
        {title ? <p className="callout__title">{title}</p> : null}
        <div className="callout__text">{children}</div>
      </div>
    </div>
  );
}

export function LegendKey({ items }) {
  return (
    <div className="legend">
      {items.map((it) => (
        <span className="legend__item" key={it.label}>
          <span className={`badge ${it.cls}`}>{it.badge}</span>
          <span className="legend__desc">{it.label}</span>
        </span>
      ))}
    </div>
  );
}
