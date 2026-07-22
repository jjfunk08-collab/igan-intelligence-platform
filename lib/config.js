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

  "focal-epilepsy": {
    slug: "focal-epilepsy",
    label: "Focal Epilepsy",
    short: "Focal Epilepsy",
    accent: "#0d7377",
    blurb: "Localized (focal-onset) seizures — a large anti-seizure market where Biohaven's Kv7.2/7.3 activator opakalim (BHV-7000) is in pivotal development.",
    model: {
      type: "brain",
      title: "Focal epilepsy — mechanism map & Kv7 target",
      caption: "Tap a marker to see the mechanism and which tracked drug classes act there.",
      hotspots: [
        { id: "focus", x: 108, y: 104, label: "Cortical seizure focus", body: "In focal epilepsy, seizures arise from a localized region of hyperexcitable cortex and can spread from there to other areas of the brain.", tags: ["Disease origin"] },
        { id: "hyperexcitable", x: 300, y: 92, label: "Neuronal membrane hyperexcitability", body: "Abnormal, excessive neuronal firing reflects an imbalance between excitation and inhibition at the cell membrane.", tags: ["Broad-spectrum ASMs"] },
        { id: "kv7", x: 300, y: 150, label: "Kv7.2/7.3 potassium channels", body: "These channels help set the resting membrane potential; selectively activating them dampens abnormal firing. This is opakalim's mechanism of action.", tags: ["Opakalim / BHV-7000 (selective Kv7.2/7.3 activator)"] },
        { id: "sodium", x: 300, y: 206, label: "Voltage-gated sodium channels", body: "Many established anti-seizure medicines reduce neuronal firing by blocking voltage-gated sodium channels.", tags: ["Lacosamide", "Cenobamate", "Eslicarbazepine"] },
        { id: "propagation", x: 200, y: 150, label: "Seizure propagation", body: "Untreated focal seizures can propagate along neural networks; controlling the focus limits spread and secondary generalization.", tags: ["Adjunctive therapy goal"] },
      ],
    },
    condition: "Focal Epilepsy",
    literatureQuery: '("focal epilepsy" OR "partial epilepsy" OR "focal onset seizures")',
    newsFeeds: [
      {
        label: "Focal epilepsy — all news",
        url: "https://news.google.com/rss/search?q=%22focal%20epilepsy%22%20OR%20%22focal%20seizures%22&hl=en-US&gl=US&ceid=US:en",
      },
      {
        label: "Focal epilepsy — regulatory & trials",
        url: "https://news.google.com/rss/search?q=(%22focal%20epilepsy%22%20OR%20%22focal%20seizures%22)%20(FDA%20OR%20approval%20OR%20trial)&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    // Competitor approved adjunctive therapies for focal (partial-onset) seizures.
    // Biohaven's own opakalim (BHV-7000) is investigational and is intentionally
    // excluded here — it is tracked via ClinicalTrials.gov, not as an approval.
    knownApprovedTherapies: [
      { brand: "Xcopri", generic: "cenobamate", manufacturer: "SK Life Science, Inc.", approvalType: "Adjunctive — partial-onset seizures", effectiveDate: "2019-11-21", url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
      { brand: "Aptiom", generic: "eslicarbazepine acetate", manufacturer: "Sunovion Pharmaceuticals Inc.", approvalType: "Partial-onset seizures", effectiveDate: "2013-11-08", url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
      { brand: "Fycompa", generic: "perampanel", manufacturer: "Eisai Inc.", approvalType: "Partial-onset seizures", effectiveDate: "2012-10-22", url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
      { brand: "Vimpat", generic: "lacosamide", manufacturer: "UCB, Inc.", approvalType: "Partial-onset seizures", effectiveDate: "2008-10-28", url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
      { brand: "Briviact", generic: "brivaracetam", manufacturer: "UCB, Inc.", approvalType: "Partial-onset seizures", effectiveDate: "2016-02-18", url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
    ],
  },

  "parkinsons": {
    slug: "parkinsons",
    label: "Parkinson's Disease",
    short: "Parkinson's",
    accent: "#00a3da",
    blurb: "Early Parkinson's disease — where Biohaven's brain-penetrant TYK2/JAK1 inhibitor BHV-8000 is testing whether targeting neuroinflammation can slow progression, against a field of symptomatic therapies and disease-modification programs.",
    model: {
      type: "brain-pd",
      title: "Parkinson's disease — mechanism map & BHV-8000 target",
      caption: "Tap a marker to see the mechanism and which tracked approaches act there.",
      hotspots: [
        { id: "nigra", x: 116, y: 150, label: "Substantia nigra", body: "Parkinson's is driven by progressive loss of dopamine-producing neurons in the substantia nigra, reducing dopamine reaching the striatum.", tags: ["Disease origin"] },
        { id: "neuron", x: 298, y: 118, label: "Dopaminergic neuron", body: "As these neurons degenerate, dopaminergic signaling falls — the deficit that dopamine-replacement therapies (levodopa, agonists) address symptomatically.", tags: ["Levodopa", "Dopamine agonists"] },
        { id: "synuclein", x: 298, y: 152, label: "Alpha-synuclein / Lewy body", body: "Misfolded alpha-synuclein aggregates (Lewy bodies) accumulate inside neurons and are a target of disease-modification antibody programs.", tags: ["Prasinezumab (anti-α-synuclein)"] },
        { id: "microglia", x: 345, y: 188, label: "Neuroinflammation (microglia)", body: "Activated microglia and immune signaling (including Th17 and JAK/TYK2 pathways) are implicated in driving progression. This is BHV-8000's mechanism.", tags: ["BHV-8000 (TYK2/JAK1 inhibitor)", "NLRP3 inhibitors"] },
        { id: "striatum", x: 205, y: 205, label: "Striatal dopamine signaling", body: "The nigrostriatal projection delivers dopamine to the striatum; restoring or preserving this signaling is the goal of most symptomatic therapies.", tags: ["Symptomatic control"] },
      ],
    },
    condition: "Parkinson Disease",
    literatureQuery: 'Parkinson disease AND ("disease-modifying" OR neuroinflammation OR "alpha-synuclein" OR neuroprotection OR levodopa)',
    newsFeeds: [
      {
        label: "Parkinson's — all news",
        url: "https://news.google.com/rss/search?q=%22Parkinson%27s%20disease%22%20OR%20%22Parkinson%20disease%22&hl=en-US&gl=US&ceid=US:en",
      },
      {
        label: "Parkinson's — regulatory & trials",
        url: "https://news.google.com/rss/search?q=%28%22Parkinson%27s%20disease%22%29%20%28FDA%20OR%20approval%20OR%20trial%29&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    // Competitor approved symptomatic Parkinson's therapies. BHV-8000 (Biohaven)
    // is investigational and disease-modification-focused, tracked via trials.
    knownApprovedTherapies: [
      { brand: "Vyalev", generic: "foscarbidopa/foslevodopa", manufacturer: "AbbVie Inc.", approvalType: "Motor fluctuations, advanced PD (SC infusion)", effectiveDate: "2024-10-17", url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
      { brand: "Onapgo", generic: "apomorphine hydrochloride (infusion)", manufacturer: "Supernus Pharmaceuticals, Inc.", approvalType: "Motor fluctuations, advanced PD (SC infusion)", effectiveDate: "2025-02-04", url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
      { brand: "Gocovri", generic: "amantadine (extended-release)", manufacturer: "Supernus Pharmaceuticals, Inc.", approvalType: "Dyskinesia / off episodes adjunct", effectiveDate: "2017-08-24", url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
      { brand: "Ongentys", generic: "opicapone", manufacturer: "Amneal Pharmaceuticals", approvalType: "COMT-inhibitor adjunct to levodopa", effectiveDate: "2020-04-24", url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
      { brand: "Nourianz", generic: "istradefylline", manufacturer: "Kyowa Kirin, Inc.", approvalType: "Adenosine A2A antagonist adjunct", effectiveDate: "2019-08-27", url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
      { brand: "Carbidopa/levodopa", generic: "carbidopa/levodopa (IR, generic)", manufacturer: "Multiple generic manufacturers", approvalType: "Standard-of-care dopamine replacement", effectiveDate: null, url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
    ],
  },

  "obesity": {
    slug: "obesity",
    label: "Obesity",
    short: "Obesity",
    accent: "#b5680a",
    blurb: "Chronic weight management — where Biohaven's myostatin/activin-pathway inhibitor taldefgrobep alfa (BHV-2000) is being tested for muscle-preserving \"high-quality\" weight loss, against the GLP-1 class and other muscle-preservation programs.",
    model: {
      type: "metabolic",
      title: "Obesity — muscle/fat biology & taldefgrobep target",
      caption: "Tap a marker to see the mechanism and which tracked drug classes act there.",
      hotspots: [
        { id: "myostatin", x: 205, y: 86, label: "Myostatin & activin A", body: "These signaling ligands limit muscle growth and influence fat. Taldefgrobep alfa (BHV-2000) binds myostatin and inhibits both myostatin and activin A signaling — its core mechanism.", tags: ["Taldefgrobep alfa / BHV-2000", "Anti-myostatin antibodies"] },
        { id: "actrii", x: 150, y: 150, label: "ActRII receptor", body: "Myostatin/activin act through activin type II receptors on muscle and fat; blocking this axis aims to preserve or build lean mass during weight loss.", tags: ["Bimagrumab (ActRII antagonist)"] },
        { id: "muscle", x: 95, y: 196, label: "Skeletal muscle (lean mass)", body: "A key concern with rapid weight loss is loss of lean muscle mass. Muscle-preserving agents aim to protect it while fat is reduced.", tags: ["Muscle preservation"] },
        { id: "adipose", x: 305, y: 150, label: "Adipose tissue (fat mass)", body: "Reducing fat mass is the primary goal of weight-management therapies; the differentiator is how much of the loss is fat versus muscle.", tags: ["Fat reduction"] },
        { id: "glp1", x: 305, y: 88, label: "GLP-1 pathway", body: "Approved GLP-1 (and GLP-1/GIP) agonists drive large total-weight reductions but from a mix of fat and lean mass — the competitive backdrop, and a potential combination partner.", tags: ["Semaglutide", "Tirzepatide"] },
      ],
    },
    condition: "Obesity",
    literatureQuery: 'obesity AND (myostatin OR activin OR "lean mass" OR "muscle preservation" OR GLP-1 OR semaglutide OR tirzepatide)',
    newsFeeds: [
      {
        label: "Obesity — all news",
        url: "https://news.google.com/rss/search?q=%22obesity%20drug%22%20OR%20%22weight-loss%20drug%22%20OR%20%22anti-obesity%22%20OR%20%22GLP-1%22&hl=en-US&gl=US&ceid=US:en",
      },
      {
        label: "Obesity — regulatory & trials",
        url: "https://news.google.com/rss/search?q=%28obesity%20OR%20%22weight%20loss%22%29%20%28FDA%20OR%20approval%20OR%20trial%29&hl=en-US&gl=US&ceid=US:en",
      },
    ],
    // Competitor approved anti-obesity medications. Taldefgrobep alfa (BHV-2000)
    // is investigational (Phase 2b) and tracked via ClinicalTrials.gov.
    knownApprovedTherapies: [
      { brand: "Zepbound", generic: "tirzepatide", manufacturer: "Eli Lilly and Company", approvalType: "Chronic weight management (GLP-1/GIP)", effectiveDate: "2023-11-08", url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
      { brand: "Wegovy", generic: "semaglutide", manufacturer: "Novo Nordisk", approvalType: "Chronic weight management (GLP-1)", effectiveDate: "2021-06-04", url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
      { brand: "Saxenda", generic: "liraglutide", manufacturer: "Novo Nordisk", approvalType: "Chronic weight management (GLP-1)", effectiveDate: "2014-12-23", url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
      { brand: "Qsymia", generic: "phentermine/topiramate ER", manufacturer: "Vivus LLC", approvalType: "Chronic weight management", effectiveDate: "2012-07-17", url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
      { brand: "Contrave", generic: "naltrexone/bupropion ER", manufacturer: "Currax Pharmaceuticals", approvalType: "Chronic weight management", effectiveDate: "2014-09-10", url: "https://www.accessdata.fda.gov/scripts/cder/daf/" },
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
