// Central configuration: company/brand identity + data-source metadata.
// Editing this file re-brands or re-scopes the whole app.

export const COMPANY = {
  // NOTE: The former "Biohaven Pharmaceutical Holding Company Ltd." was
  // acquired by Pfizer in 2022. The current public entity is "Biohaven Ltd."
  // Confirm with Brand/Legal which name should appear, then edit here.
  legalName: "Biohaven Ltd.",
  shortName: "Biohaven",
  developer: "John Funk",
  product: "IgAN Intelligence",
  productLong: "IgA Nephropathy Regulatory & Competitive Intelligence",
  tagline: "Setting a New Course",
  website: "https://www.biohaven.com",
};

// The therapeutic area this instance tracks. Change these two strings to
// re-point the platform at a different indication.
export const AREA = {
  label: "IgA Nephropathy",
  // Query terms used across sources. Kept conservative to reduce noise.
  condition: "IgA Nephropathy",
  literatureQuery: '"IgA nephropathy"',
};

// How long (seconds) fetched data is cached before the next request
// triggers a refresh. 86400 = once per day. This is the preview's
// "database": Vercel's built-in ISR data cache, no external DB required.
export const REVALIDATE_SECONDS = 86400;

// Source registry — powers the /sources page and the attribution tags.
export const SOURCES = {
  clinicaltrials: {
    name: "ClinicalTrials.gov",
    attribution: "U.S. National Library of Medicine",
    home: "https://clinicaltrials.gov",
    api: "https://clinicaltrials.gov/data-api/api",
    terms: "https://clinicaltrials.gov/about-site/terms-conditions",
    cadence: "Real-time at source; refreshed here daily",
    auth: "None",
  },
  openfda: {
    name: "openFDA",
    attribution: "U.S. Food and Drug Administration",
    home: "https://open.fda.gov",
    api: "https://api.fda.gov",
    terms: "https://open.fda.gov/terms/",
    cadence: "~Weekly at source; refreshed here daily",
    auth: "Optional API key",
  },
  europepmc: {
    name: "Europe PMC",
    attribution: "EMBL-EBI (indexes PubMed + preprints)",
    home: "https://europepmc.org",
    api: "https://europepmc.org/RestfulWebService",
    terms: "https://europepmc.org/About",
    cadence: "Continuous at source; refreshed here daily",
    auth: "None",
  },
  news: {
    name: "News (RSS)",
    attribution: "Google News aggregation of publisher feeds",
    home: "https://news.google.com",
    api: "RSS 2.0",
    terms: "https://news.google.com",
    cadence: "Continuous at source; refreshed here daily",
    auth: "None",
  },
};

// RSS feeds compiled into the news / brief views. Add or remove freely.
export const NEWS_FEEDS = [
  {
    label: "IgA nephropathy — all news",
    url: "https://news.google.com/rss/search?q=%22IgA%20nephropathy%22&hl=en-US&gl=US&ceid=US:en",
  },
  {
    label: "IgA nephropathy — regulatory & trials",
    url: "https://news.google.com/rss/search?q=%22IgA%20nephropathy%22%20(FDA%20OR%20approval%20OR%20trial%20OR%20EMA)&hl=en-US&gl=US&ceid=US:en",
  },
];

export const DISCLAIMER =
  "For internal research and competitive-intelligence use only. Not medical advice, and not for promotional use. All records link to their original public source.";
