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

import { REVALIDATE_SECONDS } from "../config";

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

export const CATEGORY_ORDER = CATEGORIES.map((c) => ({ key: c.key, label: c.label, resolvability: c.resolvability }));

function classifyText(text) {
  const t = String(text || "");
  const hits = [];
  for (const c of CATEGORIES) {
    if (c.re.test(t)) hits.push({ key: c.key, label: c.label, resolvability: c.resolvability });
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
export const CRL_PLAYBOOK = [
  { driver: "External controls / RWE as the pivotal basis", deRisker: "Adequate and well-controlled pivotal design, with endpoints and analyses pre-specified before unblinding." },
  { driver: "Post-hoc or non-prespecified analyses carrying the primary claim", deRisker: "Written FDA alignment on endpoints and the evidentiary standard — ideally an SPA — so the bar can't move mid-review." },
  { driver: "Inadequate PK bridging / bioequivalence for new formulations", deRisker: "A clean bioequivalence / clin-pharm bridge established early for any new formulation." },
  { driver: "Facility & CMC readiness (the single most common driver)", deRisker: "Inspection-ready sites and manufacturing well ahead of the PDUFA window, including partners and contract facilities." },
  { driver: "Dependency risk (a companion product not yet cleared)", deRisker: "A REMS and companion-product plan mapped before filing, not after." },
];

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
    const mfr = String(d.manufacturer || "").replace(CORP_STOP, " ").replace(/[^a-z0-9\s]/gi, " ").trim().toLowerCase();
    const firstMfr = mfr.split(/\s+/)[0];
    if (firstMfr && firstMfr.length >= 4 && firstMfr !== "multiple") terms.add(firstMfr);
    const brand = String(d.brand || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (brand && brand.length >= 4) terms.add(brand);
    const gen = String(d.generic || "").split(/[\s/(]/)[0].toLowerCase();
    if (gen && gen.length >= 5) terms.add(gen);
  }
  return [...terms];
}

function matchOf(letter, terms) {
  const hay = `${letter.company_name || ""} ${(letter.application_number || []).join(" ")} ${letter.text || ""}`.toLowerCase();
  for (const t of terms) {
    if (t && hay.includes(t)) return t;
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

export async function getCRLCorpus({ sample = 250 } = {}) {
  const accessDate = new Date().toISOString();
  let raw = [];
  let total = null;
  let live = false;
  try {
    const totalJson = await fdaFetch("limit=1");
    total = totalJson?.meta?.results?.total ?? null;
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

  const letters = raw.map((l, i) => {
    const categories = classifyText(l.text);
    const sections = deficiencyExcerpts(l.text);
    const { fdaUrl, pdfUrl } = crlLinks(l);
    return {
      id: `${(l.application_number || [])[0] || "crl"}-${i}`,
      company: l.company_name || "—",
      application: (l.application_number || []).join(", "),
      appType: /BLA/i.test((l.application_number || []).join(" ")) ? "BLA" : /ANDA/i.test((l.application_number || []).join(" ")) ? "ANDA" : "NDA",
      date: normalizeCrlDate(l.letter_date),
      center: (l.approver_center || []).find((c) => /CDER|CBER/i.test(c)) || (l.approver_center || [])[0] || null,
      categories,
      categoryKeys: categories.map((c) => c.key),
      sections,
      excerpt: cleanExcerpt(l.text),
      fdaUrl,
      pdfUrl,
    };
  });

  // Deficiency mix across the sample (strongest category per letter).
  const mixMap = new Map(CATEGORY_ORDER.map((c) => [c.key, { ...c, count: 0 }]));
  for (const l of letters) {
    if (l.categories.length) mixMap.get(l.categories[0].key).count += 1;
  }
  const mix = [...mixMap.values()].filter((c) => c.count > 0).sort((a, b) => b.count - a.count);

  return {
    ok: true, live, total, sampleSize: letters.length,
    letters, mix, categories: CATEGORY_ORDER,
    anchor: CRL_ANCHOR, playbook: CRL_PLAYBOOK,
    source: "openFDA — Complete Response Letters",
    sourceUrl: "https://open.fda.gov/apis/transparency/completeresponseletters",
    accessDate,
  };
}
