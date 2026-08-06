// Regulatory-risk intelligence from the FDA's published Complete Response
// Letter (CRL) corpus, via openFDA. Adds "why applications get rejected"
// context alongside the app's approvals/analytics — additive, never a
// replacement for existing data.
//
// Endpoint: https://api.fda.gov/transparency/crl.json
//   fields: company_name, application_number[], letter_date, letter_type,
//           approver_center[], text (OCR of the redacted letter), file_name
//
// Everything degrades gracefully: if openFDA is unreachable we fall back to a
// small embedded seed set and flag it (live: false).

import { REVALIDATE_SECONDS, listIndications } from "../config";

const BASE = "https://api.fda.gov/transparency/crl.json";

// ---- Deficiency categories (priority order; first match wins) --------------
// Patterns are intentionally specific to reduce boilerplate false-positives
// ("safety and effectiveness" appears in nearly every letter's preamble).
const CATEGORIES = [
  { key: "clinical", label: "Clinical / Efficacy", resolvability: "Often needs a new trial",
    re: /(adequate and well-controlled|failed to (demonstrate|establish)|efficacy (was|were) not|did not (meet|demonstrate).*(endpoint|efficacy)|primary (efficacy )?endpoint|substantial evidence of effectiveness|externally controlled|real-world evidence)/i },
  { key: "safety", label: "Safety", resolvability: "Variable",
    re: /(safety (concern|signal|issue|risk)|unacceptable.*(toxicity|risk)|benefit[- ]risk (profile|assessment).*(not|unfavor)|serious adverse)/i },
  { key: "bioequiv", label: "Bioequivalence / Clin-Pharm", resolvability: "Variable",
    re: /(bioequivalence|bioavailability|dissolution|clinical pharmacology|pharmacokinetic bridg)/i },
  { key: "cmc", label: "Manufacturing / CMC", resolvability: "Usually procedural",
    re: /(chemistry,? manufacturing|current good manufacturing|product quality|drug (substance|product) (specification|stability)|CMC)/i },
  { key: "facility", label: "Facility / Inspection", resolvability: "Usually procedural",
    re: /(pre-?approval inspection|inspection of your|classified as (OAI|withhold)|facility.*(deficien|not (in|acceptable))|establishment inspection)/i },
  { key: "labeling", label: "Labeling", resolvability: "Usually procedural",
    re: /(proposed labeling|labeling (is|was) not|prescribing information (is|was)|proprietary name)/i },
  { key: "nonclinical", label: "Nonclinical", resolvability: "Variable",
    re: /(nonclinical|pharmacology\/toxicology|carcinogenicity|reproductive toxic)/i },
];

// Plain-language overview per deficiency category (shown when a user clicks a
// deficiency to learn more).
const CATEGORY_DEFS = {
  clinical: "The FDA was not convinced the trials showed the drug works. Typically the hardest CRL to clear — it usually means another adequate and well-controlled trial, not a paperwork fix. This is the bucket Biohaven's troriluzole letter falls in.",
  safety: "The FDA judged the safety or benefit-risk profile inadequate as submitted. Resolution ranges from added analyses or a REMS to new studies, depending on the concern.",
  bioequiv: "Clinical-pharmacology or bioequivalence data (often for a new formulation) did not adequately bridge to the reference. Usually addressable with a targeted PK/BE study.",
  cmc: "Chemistry, manufacturing and controls — drug substance/product quality, specifications, or stability. Usually procedural but time-consuming; frequently redacted, so its true frequency is understated.",
  facility: "A manufacturing facility (the sponsor's or a partner's) was not in an acceptable inspection state. Cleared by re-inspection once findings are remediated.",
  labeling: "Disagreement on the proposed labeling or proprietary name. Generally the most quickly resolved category.",
  nonclinical: "Outstanding pharmacology/toxicology (animal) questions. Resolution depends on whether new nonclinical studies are required.",
};

export const CATEGORY_ORDER = CATEGORIES.map((c) => ({
  key: c.key, label: c.label, resolvability: c.resolvability, def: CATEGORY_DEFS[c.key] || "",
}));

function classifyText(text) {
  const t = String(text || "");
  const hits = [];
  for (const c of CATEGORIES) {
    if (c.re.test(t)) hits.push({ key: c.key, label: c.label, resolvability: c.resolvability, def: CATEGORY_DEFS[c.key] || "" });
  }
  return hits;
}

// ---- Biohaven anchor case (static, from public disclosures) -----------------
export const CRL_ANCHOR = {
  program: "VYGLXIA (troriluzole)",
  platform: "Glutamate platform",
  indication: "Spinocerebellar ataxia (SCA)",
  date: "November 4, 2025",
  designations: "Orphan Drug + Fast Track + Priority Review",
  why: "The pivotal package leaned on an externally controlled, real-world-evidence study. The FDA cited concerns it considers inherent to that design — potential bias, lack of pre-specification, and unmeasured confounding — and held the effect did not clear the \"large and robust\" bar it had flagged in March 2024.",
  bucket: "clinical",
  note: "Summarized from Biohaven's public disclosures and coverage of the Nov 2025 CRL; the letter's specific language remains confidential. This is the company's own characterization.",
};

// ---- Failure-mode -> de-risking playbook (static, from the CRL corpus) ------
// Each item carries a `detail` (what actually happens and how to verify you've
// neutralized it) surfaced on click/hover, plus the category it maps to.
export const CRL_PLAYBOOK = [
  {
    driver: "External controls / RWE as the pivotal basis",
    deRisker: "Adequate and well-controlled pivotal design, with endpoints and analyses pre-specified before unblinding.",
    cat: "clinical",
    frequency: "Rare but near-fatal",
    detail: "When the primary evidence is an externally controlled or real-world-evidence study, the FDA discounts it for confounding, selection bias, and missing pre-specification. It rarely accepts additional analyses as a fix — it asks for a randomized, controlled trial, adding years. Verify neutralization: your pivotal is randomized and controlled, the statistical analysis plan is locked before unblinding, and any RWE is supportive, not primary.",
  },
  {
    driver: "Post-hoc or non-prespecified analyses carrying the primary claim",
    deRisker: "Written FDA alignment on endpoints and the evidentiary standard — ideally an SPA — so the bar can't move mid-review.",
    cat: "clinical",
    frequency: "Common in efficacy CRLs",
    detail: "If the win depends on a subgroup or an analysis chosen after seeing the data, the FDA treats it as hypothesis-generating, not confirmatory. Verify neutralization: the primary endpoint, population, and analysis are agreed with the FDA in writing (a Special Protocol Assessment is strongest) before the database locks.",
  },
  {
    driver: "Inadequate PK bridging / bioequivalence for new formulations",
    deRisker: "A clean bioequivalence / clin-pharm bridge established early for any new formulation.",
    cat: "bioequiv",
    frequency: "Common for reformulations / 505(b)(2)",
    detail: "New salt, formulation, or route needs data linking it to the studied product. Gaps here are usually addressable but can cost a review cycle. Verify neutralization: a completed BE/relative-bioavailability study, agreed dissolution methods, and a clin-pharm package that covers the to-be-marketed formulation.",
  },
  {
    driver: "Facility & CMC readiness (the single most common driver)",
    deRisker: "Inspection-ready sites and manufacturing well ahead of the PDUFA window, including partners and contract facilities.",
    cat: "facility",
    frequency: "The most frequent driver overall",
    detail: "Most CRLs involve a manufacturing or inspection finding somewhere in the supply chain — often at a contract manufacturer, not the sponsor. It's procedural but time-bound by re-inspection scheduling. Verify neutralization: every site (yours and partners') is inspection-ready months before the PDUFA date, with open Form 483 observations closed.",
  },
  {
    driver: "Dependency risk (a companion product not yet cleared)",
    deRisker: "A REMS and companion-product plan mapped before filing, not after.",
    cat: "safety",
    frequency: "Situational",
    detail: "Approval can hinge on something outside the application — a companion diagnostic, a device, or a required risk-management program. Verify neutralization: any companion product's regulatory path is aligned to yours, and the REMS is drafted and discussed with the FDA pre-submission.",
  },
];

// Site indications, resolved once, so each letter can be tagged with the
// diseases it's relevant to (competitor company / drug / disease-term match).
function siteIndicationTerms() {
  try {
    const inds = listIndications();
    return inds.map((area) => ({ slug: area.slug, label: area.label, terms: relevanceTerms(area) }));
  } catch {
    return [];
  }
}

// ---- Seed fallback (real published letters; used only if openFDA is down) ---
const SEED = [
  { company_name: "Acacia Pharma Ltd", application_number: ["NDA 209510"], letter_date: "10/05/2018",
    text: "product quality chemistry manufacturing facility inspection deficiencies were identified" },
  { company_name: "Ascelia Pharma", application_number: ["NDA (Orviglance)"], letter_date: "2024",
    text: "the primary analysis relied on post-hoc, non-prespecified analyses and was not considered adequate and well-controlled to demonstrate efficacy" },
];

// ---- Relevance to a given indication ---------------------------------------
const DISEASE_SYNONYMS = {
  igan: ["iga nephropathy", "igan", "nephropathy", "kidney"],
  graves: ["graves", "thyroid", "hyperthyroid"],
  "focal-epilepsy": ["epilepsy", "seizure", "focal onset"],
  parkinsons: ["parkinson"],
  obesity: ["obesity", "weight management", "overweight"],
};
const CORP_STOP = /\b(inc|llc|ltd|plc|corp|corporation|company|co|pharmaceuticals?|therapeutics?|pharma|biosciences?|sciences?|group|holdings?|the|and|of|limited|gmbh|ag|sa)\b/gi;

function relevanceTerms(area) {
  const terms = new Set();
  for (const s of DISEASE_SYNONYMS[area.slug] || []) terms.add(s.toLowerCase());
  for (const d of area.knownApprovedTherapies || []) {
    const mfrWords = String(d.manufacturer || "")
      .replace(CORP_STOP, " ").replace(/[^a-z0-9\s]/gi, " ").toLowerCase()
      .split(/\s+/).filter((w) => w.length >= 4 && w !== "multiple");
    for (const w of mfrWords) terms.add(w);
    const brand = String(d.brand || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (brand && brand.length >= 4) terms.add(brand);
    const gen = String(d.generic || "").split(/[\s/(]/)[0].toLowerCase();
    if (gen && gen.length >= 5) terms.add(gen);
  }
  return [...terms];
}

// Whole-word match so short terms (e.g. "novo", "vera") don't hit inside
// unrelated words ("several" contains "vera").
function hasTerm(hay, term) {
  if (!term) return false;
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try { return new RegExp(`\\b${esc}\\b`, "i").test(hay); }
  catch { return hay.includes(term); }
}

function matchOf(letter, terms) {
  const hay = `${letter.company_name || ""} ${(letter.application_number || []).join(" ")} ${letter.text || ""}`.toLowerCase();
  for (const t of terms) {
    if (hasTerm(hay, t)) return t;
  }
  return null;
}

// ---- Fetch helpers ----------------------------------------------------------
async function fdaFetch(qs) {
  const res = await fetch(`${BASE}?${qs}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`openFDA ${res.status}`);
  return res.json();
}

function shortReason(letter) {
  const cats = letter.categories || [];
  if (cats.length) return cats.map((c) => c.label).join(" · ");
  return "Specific deficiencies redacted in the published letter";
}

export async function getCRLs(area, { sample = 200 } = {}) {
  const accessDate = new Date().toISOString();
  let raw = [];
  let total = null;
  let live = false;

  try {
    // Total corpus size (tiny payload).
    const totalJson = await fdaFetch("limit=1");
    total = totalJson?.meta?.results?.total ?? null;
    // A recent sample to classify + scan for competitor relevance.
    let sampleJson;
    try {
      sampleJson = await fdaFetch(`limit=${sample}&sort=letter_date:desc`);
    } catch {
      sampleJson = await fdaFetch(`limit=${sample}`);
    }
    raw = Array.isArray(sampleJson?.results) ? sampleJson.results : [];
    live = raw.length > 0;
  } catch {
    raw = SEED.slice();
    live = false;
  }
  if (!raw.length) { raw = SEED.slice(); live = false; }

  const classified = raw.map((l) => {
    const categories = classifyText(l.text);
    return {
      company: l.company_name || "—",
      application: (l.application_number || []).join(", "),
      date: normalizeCrlDate(l.letter_date),
      categories,
      primary: categories[0] || null,
      fileName: l.file_name || null,
      _text: l.text || "",
    };
  });

  // Deficiency mix across the sample.
  const mixMap = new Map(CATEGORY_ORDER.map((c) => [c.key, { ...c, count: 0 }]));
  let redacted = 0;
  for (const l of classified) {
    if (!l.categories.length) { redacted += 1; continue; }
    // Count the single strongest (first, by priority) category per letter.
    const k = l.categories[0].key;
    mixMap.get(k).count += 1;
  }
  const mix = [...mixMap.values()].filter((c) => c.count > 0).sort((a, b) => b.count - a.count);

  // Competitor-relevant letters for this indication.
  const terms = relevanceTerms(area);
  const relevant = [];
  for (const l of classified) {
    const m = matchOf({ company_name: l.company, application_number: [l.application], text: l._text }, terms);
    if (m) relevant.push({ ...l, matchedOn: m, reason: shortReason(l) });
    if (relevant.length >= 12) break;
  }

  return {
    ok: true,
    live,
    total,
    sampleSize: classified.length,
    redacted,
    mix,
    items: relevant.map(({ _text, ...rest }) => rest),
    anchor: CRL_ANCHOR,
    playbook: CRL_PLAYBOOK,
    source: "openFDA — Complete Response Letters",
    sourceUrl: "https://open.fda.gov/apis/transparency/completeresponseletters",
    accessDate,
  };
}

function normalizeCrlDate(v) {
  if (!v) return null;
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  return s;
}

// ---------------------------------------------------------------------------
// CRL TRACKER CORPUS (standalone page)
// Returns a browsable corpus: each letter with its deficiency categories, the
// specific excerpts the FDA cited (the "sections"), a readable excerpt, and
// links to the actual letter on Drugs@FDA.
// ---------------------------------------------------------------------------

function appNumeric(app) {
  const m = String(app || "").match(/(\d{4,7})/);
  return m ? m[1] : null;
}

function crlLinks(letter) {
  const app = (letter.application_number || [])[0] || "";
  const num = appNumeric(app);
  const fdaUrl = num
    ? `https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=${num}`
    : "https://open.fda.gov/apis/transparency/completeresponseletters";
  // Best-effort direct PDF from the file_name (pattern: {appno}_{year}_{rest}.pdf)
  let pdfUrl = null;
  const fn = String(letter.file_name || "");
  const fm = fn.match(/^(\d+)_(\d{4})_(.+\.pdf)$/i);
  if (fm) pdfUrl = `https://www.accessdata.fda.gov/drugsatfda_docs/nda/${fm[2]}/${fm[1]}${fm[3]}`;
  return { fdaUrl, pdfUrl };
}

// Strip OCR boilerplate (address block, reference IDs, signature) and return a
// readable excerpt of the substantive body.
function cleanExcerpt(text, max = 600) {
  let t = String(text || "")
    .replace(/\r/g, "")
    .replace(/Reference ID:\s*\d+/gi, " ")
    .replace(/DEPARTMENT OF HEALTH AND HUMAN SERVICES/gi, " ")
    .replace(/Food and Drug Administration\s+Silver Spring,? MD\s*\d*/gi, " ")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  // Prefer to start at the first substantive sentence.
  const start = t.search(/(We have completed our review|We have determined|This letter|Your application|reference to your|complete response)/i);
  if (start > 0) t = t.slice(start);
  t = t.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, t.lastIndexOf(" ", max)).trim() + "\u2026";
}

// For each detected category, pull up to 2 sentences from the letter that
// evidence it — these become the "sections / main deficiencies" in the zoom view.
function deficiencyExcerpts(text) {
  const sentences = String(text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.;])\s+/)
    .filter((s) => s.length > 40 && s.length < 400);
  const out = [];
  for (const c of CATEGORIES) {
    const hits = [];
    for (const s of sentences) {
      if (c.re.test(s)) {
        const clean = s.trim();
        if (!hits.includes(clean)) hits.push(clean);
      }
      if (hits.length >= 2) break;
    }
    if (hits.length) out.push({ key: c.key, label: c.label, resolvability: c.resolvability, snippets: hits });
  }
  return out;
}

export async function getCRLCorpus({ sample = 1000 } = {}) {
  const accessDate = new Date().toISOString();
  let raw = [];
  let total = null;
  let live = false;
  try {
    const totalJson = await fdaFetch("limit=1");
    total = totalJson?.meta?.results?.total ?? null;
    // Pull the whole corpus (openFDA caps a page at 1000, which currently
    // exceeds the full CRL corpus, so this is effectively "all letters").
    let sampleJson;
    try { sampleJson = await fdaFetch(`limit=${sample}&sort=letter_date:desc`); }
    catch { sampleJson = await fdaFetch(`limit=${sample}`); }
    raw = Array.isArray(sampleJson?.results) ? sampleJson.results : [];
    live = raw.length > 0;
  } catch {
    raw = SEED.slice();
    live = false;
  }
  if (!raw.length) { raw = SEED.slice(); live = false; }

  const indexers = siteIndicationTerms();

  const letters = raw.map((l, i) => {
    const categories = classifyText(l.text);
    const sections = deficiencyExcerpts(l.text);
    const { fdaUrl, pdfUrl } = crlLinks(l);
    // Which site diseases is this letter relevant to?
    const hay = `${l.company_name || ""} ${(l.application_number || []).join(" ")} ${l.text || ""}`.toLowerCase();
    const indications = indexers
      .filter((ix) => ix.terms.some((t) => hasTerm(hay, t)))
      .map((ix) => ix.slug);
    const date = normalizeCrlDate(l.letter_date);
    return {
      id: `${(l.application_number || [])[0] || "crl"}-${i}`,
      company: l.company_name || "—",
      application: (l.application_number || []).join(", "),
      appType: /BLA/i.test((l.application_number || []).join(" ")) ? "BLA" : /ANDA/i.test((l.application_number || []).join(" ")) ? "ANDA" : "NDA",
      date,
      year: date ? String(date).slice(0, 4) : null,
      center: (l.approver_center || []).find((c) => /CDER|CBER/i.test(c)) || (l.approver_center || [])[0] || null,
      categories,
      categoryKeys: categories.map((c) => c.key),
      indications,
      sections,
      excerpt: cleanExcerpt(l.text),
      fdaUrl,
      pdfUrl,
    };
  });

  // Deficiency mix across the corpus (strongest category per letter).
  const mixMap = new Map(CATEGORY_ORDER.map((c) => [c.key, { ...c, count: 0 }]));
  for (const l of letters) {
    if (l.categories.length) mixMap.get(l.categories[0].key).count += 1;
  }
  const mix = [...mixMap.values()].filter((c) => c.count > 0).sort((a, b) => b.count - a.count);

  // Letters by year (for the timeline chart).
  const yearMap = new Map();
  for (const l of letters) {
    if (!l.year) continue;
    yearMap.set(l.year, (yearMap.get(l.year) || 0) + 1);
  }
  const byYear = [...yearMap.entries()].map(([year, count]) => ({ year, count })).sort((a, b) => a.year.localeCompare(b.year));

  // Resolvability split (how hard the strongest deficiency is to clear).
  const resMap = { procedural: 0, variable: 0, hard: 0, redacted: 0 };
  for (const l of letters) {
    const c = l.categories[0];
    if (!c) { resMap.redacted += 1; continue; }
    const r = String(c.resolvability).toLowerCase();
    if (r.includes("trial")) resMap.hard += 1;
    else if (r.includes("procedural")) resMap.procedural += 1;
    else resMap.variable += 1;
  }
  const resolvability = [
    { key: "hard", label: "Usually a new trial", count: resMap.hard, color: "#b0304a" },
    { key: "variable", label: "Variable", count: resMap.variable, color: "#b5680a" },
    { key: "procedural", label: "Usually procedural", count: resMap.procedural, color: "#3a7d18" },
    { key: "redacted", label: "Redacted / unclear", count: resMap.redacted, color: "#c3ccda" },
  ].filter((r) => r.count > 0);

  // Disease coverage counts (letters relevant to each site indication).
  const diseaseCounts = indexers.map((ix) => ({
    slug: ix.slug, label: ix.label,
    count: letters.filter((l) => l.indications.includes(ix.slug)).length,
  }));

  return {
    ok: true, live, total, sampleSize: letters.length,
    letters, mix, byYear, resolvability, diseaseCounts, categories: CATEGORY_ORDER,
    anchor: CRL_ANCHOR, playbook: CRL_PLAYBOOK,
    source: "openFDA — Complete Response Letters",
    sourceUrl: "https://open.fda.gov/apis/transparency/completeresponseletters",
    accessDate,
  };
}
