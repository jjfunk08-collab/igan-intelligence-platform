import { AREA, REVALIDATE_SECONDS, SOURCES } from "../config";

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

export async function getPublications(limit = 30) {
  const accessDate = new Date().toISOString();
  const params = new URLSearchParams({
    query: AREA.literatureQuery,
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
