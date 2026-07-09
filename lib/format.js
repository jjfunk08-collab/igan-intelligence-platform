// Small, dependency-free formatting helpers shared across views.

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Parse a variety of source date formats into a Date (or null).
// Handles: ISO "2026-01-15", "20260115" (openFDA), "January 2026", RFC-822.
export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value) ? null : value;
  const s = String(value).trim();

  // openFDA effective_time: YYYYMMDD
  if (/^\d{8}$/.test(s)) {
    const d = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00Z`);
    return isNaN(d) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

// "15 Jan 2026" — compact, unambiguous, locale-independent.
export function formatDate(value) {
  const d = parseDate(value);
  if (!d) return "—";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// "3 days ago" style relative label.
export function timeAgo(value) {
  const d = parseDate(value);
  if (!d) return "";
  const diff = Date.now() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diff / day);
  if (days < 0) return formatDate(d);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} mo ago`;
  return `${Math.floor(days / 365)} yr ago`;
}

export function accessLabel(iso) {
  const d = parseDate(iso);
  if (!d) return "";
  return `Accessed ${formatDate(d)}`;
}

// Trim long text to a clean length on a word boundary.
export function truncate(text, max = 220) {
  if (!text) return "";
  const s = String(text).replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  return s.slice(0, s.lastIndexOf(" ", max)).trim() + "…";
}

export function pluralize(n, singular, plural) {
  return `${n.toLocaleString()} ${n === 1 ? singular : plural || singular + "s"}`;
}
