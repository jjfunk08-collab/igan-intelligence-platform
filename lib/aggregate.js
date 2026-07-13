// Pure aggregation helpers — turn raw normalized records into small,
// chart-ready summaries. No fetching here; these run on data already
// pulled by lib/sources/*.

const PHASE_ORDER = ["PHASE1", "PHASE2", "PHASE3", "PHASE4", "NA"];
const PHASE_LABEL = {
  PHASE1: "Phase 1",
  PHASE2: "Phase 2",
  PHASE3: "Phase 3",
  PHASE4: "Phase 4",
  NA: "N/A",
};

export function trialsByPhase(trials) {
  const counts = Object.fromEntries(PHASE_ORDER.map((p) => [p, 0]));
  for (const t of trials) {
    const key = String(t.phaseKey || "NA").toUpperCase();
    counts[key in counts ? key : "NA"] += 1;
  }
  return PHASE_ORDER.filter((p) => counts[p] > 0).map((p) => ({
    key: p,
    label: PHASE_LABEL[p],
    count: counts[p],
  }));
}

const STATUS_GROUPS = [
  { key: "RECRUITING", label: "Recruiting", test: (s) => s.includes("RECRUITING") && !s.includes("NOT") },
  { key: "ACTIVE", label: "Active / Enrolling", test: (s) => s.includes("ACTIVE") || s.includes("ENROLLING") || s === "NOT_YET_RECRUITING" },
  { key: "COMPLETED", label: "Completed", test: (s) => s.includes("COMPLETED") },
  { key: "STOPPED", label: "Terminated / Withdrawn", test: (s) => s.includes("TERMINATED") || s.includes("WITHDRAWN") || s.includes("SUSPENDED") },
  { key: "OTHER", label: "Other", test: () => true },
];

export function trialsByStatus(trials) {
  const counts = Object.fromEntries(STATUS_GROUPS.map((g) => [g.key, 0]));
  for (const t of trials) {
    const s = String(t.status || "").toUpperCase();
    const group = STATUS_GROUPS.find((g) => g.test(s));
    counts[group.key] += 1;
  }
  return STATUS_GROUPS.filter((g) => counts[g.key] > 0).map((g) => ({
    key: g.key,
    label: g.label,
    count: counts[g.key],
  }));
}

export function topSponsors(trials, limit = 8) {
  const counts = new Map();
  for (const t of trials) {
    const name = (t.sponsor || "Unknown").trim();
    if (!name || name === "—") continue;
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([sponsor, count]) => ({ sponsor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Note: publication-volume-by-year is now computed from real per-year
// counts fetched directly from Europe PMC (see getPublicationCountsByYear
// in lib/sources/europepmc.js) rather than estimated from a sample here —
// a fixed-size recent sample under-counts older years once total volume
// exceeds the sample size.
