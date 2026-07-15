// Central configuration. The platform is now multi-indication: each entry in
// INDICATIONS is a self-contained tracker (IgAN, Graves', ...). Adding a new
// indication is a config-only change — no new page code required.

export const COMPANY = {
  // The former "Biohaven Pharmaceutical Holding Company Ltd." was acquired by
  // Pfizer in 2022; the current public entity is "Biohaven Ltd." Confirm with
  // Brand/Legal which name should appear, then edit here.
  legalName: "Biohaven Ltd.",
  shortName: "Biohaven",
  product: "Comp/Reg Intelligence",
  productLong: "Competitive & Regulatory Intelligence Tracker",
  tagline: "Setting a New Course",
  website: "https://www.biohaven.com",
};

// Cache window (seconds). 86400 = refresh once per day via ISR + daily cron.
export const REVALIDATE_SECONDS = 86400;

// ---------------------------------------------------------------------------
// INDICATION REGISTRY
// ---------------------------------------------------------------------------
export const INDICATIONS = {
  igan: {
    slug: "igan",
    label: "IgA Nephropathy",
    short: "IgAN",
    accent: "#0047bb",
    blurb: "Autoimmune kidney disease with a rapidly evolving treatment landscape.",
    model: {
      type: "kidney",
      title: "Where IgA Nephropathy strikes — and where therapies act",
      caption: "Tap a marker to see the mechanism and which tracked drug classes target it.",
      hotspots: [
        { id: "mesangium", x: 300, y: 150, label: "Mesangial IgA deposition", body: "Galactose-deficient IgA1 immune complexes deposit in the glomerular mesangium, triggering inflammation and progressive scarring.", tags: ["Disease origin"] },
        { id: "complement", x: 300, y: 92, label: "Complement activation", body: "Deposits activate the alternative and lectin complement pathways, amplifying kidney injury.", tags: ["Iptacopan (factor B)"] },
        { id: "april", x: 326, y: 220, label: "B-cell APRIL / BAFF signaling", body: "APRIL and BAFF drive B-cell production of the pathogenic galactose-deficient IgA1 upstream of the kidney.", tags: ["Sibeprenlimab (anti-APRIL)", "Atacicept (APRIL/BAFF)"] },
        { id: "eta", x: 232, y: 205, label: "Endothelin ET-A receptor", body: "Endothelin-1 constricts glomerular vessels and worsens proteinuria; ET-A blockade is protective.", tags: ["Sparsentan", "Atrasentan"] },
        { id: "proteinuria", x: 362, y: 150, label: "Filtration barrier & proteinuria", body: "Podocyte injury lets protein leak into the urine — the key efficacy marker tracked across trials.", tags: ["Budesonide (targeted-release)"] },
      ],
    },
    condition: "IgA Nephropathy",            // ClinicalTrials.gov query.cond
    literatureQuery: '"IgA nephropathy"',      // Europe PMC query
    newsFeeds: [
      {
        label: "IgA nephropathy — all news",
        url: "https://news.google.com/rss/search?q=%22IgA%20nephropathy%22&hl=en-US&gl=US&ceid=US:en",
      },
      {
        label: "IgA nephropathy — regulatory & trials",
        url: "https://news.google.com/rss/search?q=%22IgA%20nephropathy%22%20(FDA%20OR%20approval%20OR%20trial%20OR%20EMA)&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    knownApprovedTherapies: [
      { brand: "Trutakna", generic: "atacicept-vymj", manufacturer: "Vera Therapeutics, Inc.", approvalType: "Accelerated approval", effectiveDate: "2026-07-07", url: "https://www.fda.gov/drugs" },
      { brand: "Voyxact", generic: "sibeprenlimab", manufacturer: "Otsuka Pharmaceutical", approvalType: "Accelerated approval", effectiveDate: "2025-11-25", url: "https://www.otsuka-us.com" },
      { brand: "Vanrafia", generic: "atrasentan", manufacturer: "Novartis", approvalType: "Accelerated approval", effectiveDate: "2025-04-02", url: "https://www.novartis.com" },
      { brand: "Fabhalta", generic: "iptacopan", manufacturer: "Novartis", approvalType: "Accelerated approval", effectiveDate: "2024-08-08", url: "https://www.novartis.com" },
      { brand: "Filspari", generic: "sparsentan", manufacturer: "Travere Therapeutics", approvalType: "Full approval (converted from accelerated)", effectiveDate: "2023-02-17", url: "https://www.travere.com" },
      { brand: "Tarpeyo", generic: "budesonide (targeted-release)", manufacturer: "Calliditas Therapeutics", approvalType: "Full approval (converted from accelerated)", effectiveDate: "2021-12-20", url: "https://www.fda.gov/drugs" },
    ],
  },

  graves: {
    slug: "graves",
    label: "Graves' Disease",
    short: "Graves'",
    accent: "#6d2077",
    blurb: "Autoimmune hyperthyroidism and thyroid eye disease (Graves' orbitopathy).",
    model: {
      type: "thyroid",
      title: "Graves' disease & thyroid eye disease — mechanism map",
      caption: "Tap a marker to see the mechanism and which tracked drug classes target it.",
      hotspots: [
        { id: "tshr", x: 138, y: 150, label: "TSH-receptor autoantibodies", body: "Autoantibodies stimulate the TSH receptor on thyroid cells, driving excess thyroid hormone (hyperthyroidism).", tags: ["Disease origin"] },
        { id: "synthesis", x: 172, y: 196, label: "Thyroid hormone synthesis", body: "Overproduction of T3/T4 fuels symptoms. Antithyroid drugs block hormone synthesis.", tags: ["Methimazole", "Propylthiouracil"] },
        { id: "igf1r", x: 298, y: 150, label: "Orbital fibroblast IGF-1R", body: "In thyroid eye disease, IGF-1R signaling on orbital fibroblasts drives inflammation and tissue expansion behind the eye.", tags: ["Teprotumumab (IGF-1R)"] },
        { id: "proptosis", x: 332, y: 108, label: "Proptosis (eye bulging)", body: "Expansion of orbital tissue pushes the eye forward — the hallmark of active thyroid eye disease.", tags: ["Teprotumumab (IGF-1R)"] },
      ],
    },
    condition: "Graves Disease",
    literatureQuery: '("Graves disease" OR "thyroid eye disease" OR "Graves orbitopathy")',
    newsFeeds: [
      {
        label: "Graves' disease — all news",
        url: "https://news.google.com/rss/search?q=%22Graves%20disease%22%20OR%20%22thyroid%20eye%20disease%22&hl=en-US&gl=US&ceid=US:en",
      },
      {
        label: "Graves' / TED — regulatory & trials",
        url: "https://news.google.com/rss/search?q=(%22Graves%20disease%22%20OR%20%22thyroid%20eye%20disease%22)%20(FDA%20OR%20approval%20OR%20trial)&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    knownApprovedTherapies: [
      { brand: "Tepezza", generic: "teprotumumab-trbw", manufacturer: "Amgen (Horizon Therapeutics)", approvalType: "First approval — thyroid eye disease (Graves' orbitopathy)", effectiveDate: "2020-01-21", url: "https://www.fda.gov/news-events/press-announcements/fda-approves-first-treatment-thyroid-eye-disease" },
      { brand: "Tapazole", generic: "methimazole", manufacturer: "Various (generic)", approvalType: "Antithyroid drug — hyperthyroidism", effectiveDate: null, url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
      { brand: "Propylthiouracil", generic: "propylthiouracil (PTU)", manufacturer: "Various (generic)", approvalType: "Antithyroid drug — hyperthyroidism", effectiveDate: null, url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
    ],
  },
};

export function listIndications() {
  return Object.values(INDICATIONS);
}
export function getIndication(slug) {
  return INDICATIONS[slug] || null;
}

// ---------------------------------------------------------------------------
// SOURCE REGISTRY (for the /sources page + attribution tags)
// ---------------------------------------------------------------------------
export const SOURCES = {
  clinicaltrials: {
    name: "ClinicalTrials.gov", attribution: "U.S. National Library of Medicine",
    home: "https://clinicaltrials.gov", api: "https://clinicaltrials.gov/data-api/api",
    terms: "https://clinicaltrials.gov/about-site/terms-conditions",
    cadence: "Real-time at source; refreshed here daily", auth: "None",
  },
  drugsfda: {
    name: "Drugs@FDA (openFDA)", attribution: "U.S. Food and Drug Administration",
    home: "https://www.accessdata.fda.gov/scripts/cder/daf/", api: "https://api.fda.gov/drug/drugsfda.json",
    terms: "https://open.fda.gov/terms/",
    cadence: "~Weekly at source; refreshed here daily", auth: "Optional API key",
  },
  openfda: {
    name: "openFDA", attribution: "U.S. Food and Drug Administration",
    home: "https://open.fda.gov", api: "https://api.fda.gov",
    terms: "https://open.fda.gov/terms/",
    cadence: "~Weekly at source; refreshed here daily", auth: "Optional API key",
  },
  europepmc: {
    name: "Europe PMC", attribution: "EMBL-EBI (indexes PubMed + preprints)",
    home: "https://europepmc.org", api: "https://europepmc.org/RestfulWebService",
    terms: "https://europepmc.org/About",
    cadence: "Continuous at source; refreshed here daily", auth: "None",
  },
  news: {
    name: "News (RSS)", attribution: "Google News aggregation of publisher feeds",
    home: "https://news.google.com", api: "RSS 2.0",
    terms: "https://news.google.com",
    cadence: "Continuous at source; refreshed here daily", auth: "None",
  },
};

export const DISCLAIMER =
  "For internal research and competitive-intelligence use only. Not medical advice, and not for promotional use. All records link to their original public source.";
