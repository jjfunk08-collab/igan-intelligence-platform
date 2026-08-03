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

// ---------------------------------------------------------------------------
// COMPETITIVE LANDSCAPE
// ---------------------------------------------------------------------------
// Turn raw trials (+ the curated approved-therapy list) into a per-program
// pipeline view: one row per drug/sponsor program, positioned by the furthest
// phase it has reached. This is what drives the phase-timeline graphic.

const PHASE_RANK = { PHASE1: 1, PHASE2: 2, PHASE3: 3, PHASE4: 4 };

// Stage buckets for the timeline (index 0..3 = column position).
export const LANDSCAPE_STAGES = ["Phase 1", "Phase 2", "Phase 3", "Filed / Approved"];

function normDrug(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\b\d+(\.\d+)?\s?(mg|mcg|g|ml|%)\b/g, " ")
    .replace(/[®™]/g, "")
    .replace(/\b(injection|tablet|capsule|oral|iv|intravenous|subcutaneous|sc|placebo|solution|extended[- ]?release|targeted[- ]?release|delayed[- ]?release)\b/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function competitiveLandscape(trials = [], approved = [], opts = {}) {
  const { limit = 16, excludeSponsor = /biohaven/i } = opts;

  // --- 1) "Filed / Approved" = curated approvals FOR THIS INDICATION only. ---
  // This is the authoritative list of drugs actually approved for the disease.
  // We do NOT infer approval from trial phase (a Phase 4 study of an off-label
  // generic does not make that drug approved for this indication).
  const approvedList = [];
  const approvedNames = new Set();
  for (const d of approved) {
    const sponsor = (d.manufacturer || "Unknown").trim();
    if (excludeSponsor && excludeSponsor.test(sponsor)) continue;
    const nb = normDrug(d.brand), ng = normDrug(d.generic);
    if (nb) approvedNames.add(nb);
    if (ng) approvedNames.add(ng);
    approvedList.push({
      drug: d.brand, generic: d.generic || null, sponsor,
      stage: 3, stageLabel: LANDSCAPE_STAGES[3], approved: true,
      phaseKey: "APPROVED", status: "APPROVED", nct: null,
      url: d.url, lastUpdate: d.effectiveDate || null,
    });
  }
  const isApprovedName = (drug) => {
    for (const n of approvedNames) {
      if (n && (drug === n || drug.includes(n) || n.includes(drug))) return true;
    }
    return false;
  };

  // --- 2) Investigational pipeline: Phase 1/2/3 only, deduped by drug. ---
  // Phase 4 (post-marketing) and un-phased records are excluded from the
  // pipeline view. Programs are keyed by normalized drug name so the same drug
  // studied by many sponsors collapses to one row (preferring industry sponsors
  // and the most advanced phase).
  const ACADEMIC = /(universit|hospital|college|institut|foundation|fondazione|medical center|medical centre|clinic|,\s*m\.?d|national|centre hospitalier|health system)/i;
  const pipeline = new Map(); // normDrug -> program
  for (const t of trials) {
    const drug = normDrug(t.intervention);
    if (!drug || drug === "placebo") continue;
    if (isApprovedName(drug)) continue; // already represented in the approved column
    const phaseKey = String(t.phaseKey || "").toUpperCase();
    const rank = { PHASE1: 1, PHASE2: 2, PHASE3: 3 }[phaseKey] || 0;
    if (!rank) continue; // ignore NA and PHASE4
    const sponsor = (t.sponsor || "Unknown").trim();
    if (!sponsor || sponsor === "—") continue;
    if (excludeSponsor && excludeSponsor.test(sponsor)) continue;
    const industry = !ACADEMIC.test(sponsor);

    const prev = pipeline.get(drug);
    const better =
      !prev ||
      rank > prev.rank ||
      (rank === prev.rank && industry && !prev.industry) ||
      (rank === prev.rank && industry === prev.industry && String(t.lastUpdate) > String(prev.lastUpdate));
    if (better) {
      pipeline.set(drug, {
        drug: t.intervention, generic: null, sponsor,
        stage: rank - 1, stageLabel: LANDSCAPE_STAGES[rank - 1],
        approved: false, phaseKey, status: t.status, nct: t.id,
        url: t.url, lastUpdate: t.lastUpdate, rank, industry,
      });
    }
  }

  const pipelineList = [...pipeline.values()].sort(
    (a, b) => b.rank - a.rank ||
      (b.industry === a.industry ? 0 : b.industry ? 1 : -1) ||
      String(b.lastUpdate || "").localeCompare(String(a.lastUpdate || ""))
  );

  // Keep every real approval; fill the remaining slots with the most-advanced
  // pipeline programs.
  const room = Math.max(0, limit - approvedList.length);
  const combined = [...approvedList, ...pipelineList.slice(0, room)];

  // Display order: most advanced first; approvals ahead of same-stage pipeline.
  combined.sort(
    (a, b) => b.stage - a.stage ||
      (b.approved === a.approved ? 0 : b.approved ? 1 : -1) ||
      String(b.lastUpdate || "").localeCompare(String(a.lastUpdate || ""))
  );

  return combined.map(({ rank, industry, ...rest }) => rest);
}

// Richer sponsor breakdown for the "Most Active Sponsors" graphic: total
// trials, how many are recruiting, per-phase split, and the lead (furthest) phase.
export function topSponsorsDetailed(trials = [], limit = 8, opts = {}) {
  const { excludeSponsor = null } = opts;
  const m = new Map();
  for (const t of trials) {
    const name = (t.sponsor || "").trim();
    if (!name || name === "—") continue;
    if (excludeSponsor && excludeSponsor.test(name)) continue;
    if (!m.has(name)) {
      m.set(name, {
        sponsor: name, count: 0, recruiting: 0, leadRank: 0,
        phases: { PHASE1: 0, PHASE2: 0, PHASE3: 0, PHASE4: 0, NA: 0 },
      });
    }
    const e = m.get(name);
    e.count += 1;
    const pk = String(t.phaseKey || "NA").toUpperCase();
    e.phases[pk in e.phases ? pk : "NA"] += 1;
    const s = String(t.status || "").toUpperCase();
    if (s.includes("RECRUITING") && !s.includes("NOT")) e.recruiting += 1;
    const rank = PHASE_RANK[pk] || 0;
    if (rank > e.leadRank) e.leadRank = rank;
  }
  const label = { 0: "—", 1: "Phase 1", 2: "Phase 2", 3: "Phase 3", 4: "Phase 4" };
  return [...m.values()]
    .sort((a, b) => b.count - a.count || b.leadRank - a.leadRank)
    .slice(0, limit)
    .map((e) => ({ ...e, leadPhaseLabel: label[e.leadRank] }));
}

// Rank recent news by how much it signals real competitive *progression*
// (approvals, filings, late-phase readouts) rather than generic coverage.
const PROG_RULES = [
  { tag: "Approval", re: /\b(approv|authoris|authoriz|cleared|green ?light)\b/i, w: 4 },
  { tag: "Regulatory filing", re: /\b(nda|bla|sbla|maa|priority review|breakthrough|fast track|accepted|submitt|filing|designation)\b/i, w: 3 },
  { tag: "Phase 3", re: /\bphase\s?(3|iii)\b/i, w: 3 },
  { tag: "Topline data", re: /\b(topline|top-line|primary endpoint|met (the )?primary|positive (results|data)|readout|pivotal)\b/i, w: 2.5 },
  { tag: "Phase 2", re: /\bphase\s?(2|ii)\b/i, w: 1.6 },
  { tag: "Trial start", re: /\b(initiat|first patient|first subject|dosed|enrol)\b/i, w: 1.2 },
  { tag: "Phase 1", re: /\bphase\s?(1|i)\b/i, w: 1 },
];

export function scoreProgressions(news = [], limit = 3, opts = {}) {
  const { excludeSponsor = /biohaven/i } = opts;
  const now = Date.now();
  const scored = [];
  for (const n of news) {
    const title = n.title || "";
    if (!title) continue;
    if (excludeSponsor && excludeSponsor.test(title)) continue;
    let kw = 0, best = null;
    for (const rule of PROG_RULES) {
      if (rule.re.test(title)) { kw += rule.w; if (!best) best = rule.tag; }
    }
    if (kw === 0) continue; // keep only genuine progression signals
    const ts = n.date ? Date.parse(n.date) : 0;
    const ageDays = ts ? (now - ts) / 86400000 : 60;
    const recency = Math.max(0, 3 - ageDays / 14); // decays over a few weeks
    scored.push({ title: n.title, outlet: n.outlet, date: n.date, url: n.url, tag: best, score: kw + recency, ts });
  }
  scored.sort((a, b) => b.score - a.score || b.ts - a.ts);
  return scored.slice(0, limit);
}

// Note: publication-volume-by-year is now computed from real per-year
// counts fetched directly from Europe PMC (see getPublicationCountsByYear
// in lib/sources/europepmc.js) rather than estimated from a sample here —
// a fixed-size recent sample under-counts older years once total volume
// exceeds the sample size.
