import { REVALIDATE_SECONDS, SOURCES } from "../config";

const BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";
const UA =
  "Biohaven-IgAN-Intelligence/preview (competitive-intelligence; contact: john.funk@biohaven.com)";

function linkFor(r) {
  if (r.doi) return `https://doi.org/${r.doi}`;
  if (r.pmid) return `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`;
  if (r.id && r.source) return `https://europepmc.org/article/${r.source}/${r.id}`;
  return SOURCES.europepmc.home;
}

function normalize(r) {
  const isPreprint = r.source === "PPR";
  return {
    id: `${r.source}-${r.id}`,
    title: r.title || "Untitled",
    authors: r.authorString || "",
    journal: isPreprint ? "Preprint" : r.journalTitle || "",
    isPreprint,
    date: r.firstPublicationDate || (r.pubYear ? `${r.pubYear}-01-01` : null),
    year: r.pubYear || "",
    citedBy: typeof r.citedByCount === "number" ? r.citedByCount : null,
    url: linkFor(r),
  };
}

function ymd(d) {
  return d.toISOString().slice(0, 10);
}

// Publications first published within the last `months` months.
export async function getRecentPublications(area, months = 6, limit = 40) {
  const accessDate = new Date().toISOString();
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - months);
  const dateClause = `FIRST_PDATE:[${ymd(from)} TO ${ymd(to)}]`;
  const params = new URLSearchParams({
    query: `${area.literatureQuery} AND (${dateClause})`,
    format: "json",
    resultType: "lite",
    pageSize: String(limit),
    sort: "P_PDATE_D desc",
  });
  try {
    const res = await fetch(`${BASE}?${params.toString()}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const items = (data.resultList?.result || []).map(normalize);
    return {
      ok: true, source: SOURCES.europepmc, months,
      total: typeof data.hitCount === "number" ? data.hitCount : items.length,
      items, error: null, accessDate,
    };
  } catch (err) {
    return { ok: false, source: SOURCES.europepmc, months, total: null, items: [], error: err.message || "Fetch failed", accessDate };
  }
}

export async function getPublications(area, limit = 30) {
  const accessDate = new Date().toISOString();
  const params = new URLSearchParams({
    query: area.literatureQuery,
    format: "json",
    resultType: "lite",
    pageSize: String(limit),
    sort: "P_PDATE_D desc",
  });

  try {
    const res = await fetch(`${BASE}?${params.toString()}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const items = (data.resultList?.result || []).map(normalize);
    return {
      ok: true,
      source: SOURCES.europepmc,
      total: typeof data.hitCount === "number" ? data.hitCount : items.length,
      items,
      error: null,
      accessDate,
    };
  } catch (err) {
    return {
      ok: false,
      source: SOURCES.europepmc,
      total: null,
      items: [],
      error: err.message || "Fetch failed",
      accessDate,
    };
  }
}

// Accurate per-year publication counts, used by the Visuals page trend chart.
// Rather than estimating from a small recent sample (which under-counts
// older years once total volume exceeds the sample size), this asks
// Europe PMC directly for each year's true hitCount — one lightweight
// count-only request per year, run in parallel.
export async function getPublicationCountsByYear(area, yearsBack = 6) {
  const accessDate = new Date().toISOString();
  const thisYear = new Date().getUTCFullYear();
  const years = [];
  for (let y = thisYear - yearsBack + 1; y <= thisYear; y++) years.push(y);

  async function countForYear(year) {
    const params = new URLSearchParams({
      query: `${area.literatureQuery} AND (PUB_YEAR:${year})`,
      format: "json",
      resultType: "idlist",
      pageSize: "1", // we only need hitCount, not the records
    });
    try {
      const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        next: { revalidate: REVALIDATE_SECONDS },
      });
      if (!res.ok) return 0;
      const data = await res.json();
      return typeof data.hitCount === "number" ? data.hitCount : 0;
    } catch {
      return 0;
    }
  }

  try {
    const counts = await Promise.all(years.map(countForYear));
    return {
      ok: true,
      source: SOURCES.europepmc,
      items: years.map((year, i) => ({ year: String(year), count: counts[i] })),
      error: null,
      accessDate,
    };
  } catch (err) {
    return {
      ok: false,
      source: SOURCES.europepmc,
      items: years.map((year) => ({ year: String(year), count: 0 })),
      error: err.message || "Fetch failed",
      accessDate,
    };
  }
}
