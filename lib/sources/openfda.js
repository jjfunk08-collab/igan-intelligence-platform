import { KNOWN_APPROVED_THERAPIES, REVALIDATE_SECONDS, SOURCES } from "../config";

const BASE = "https://api.fda.gov/drug/label.json";
const UA =
  "Biohaven-IgAN-Intelligence/preview (competitive-intelligence; contact: john.funk@biohaven.com)";

function firstOf(arr, fallback = "—") {
  return Array.isArray(arr) && arr.length ? arr[0] : fallback;
}

function normalizeLive(rec) {
  const of = rec.openfda || {};
  const brand = firstOf(of.brand_name, null);
  const generic = firstOf(of.generic_name, null);
  const name = brand || generic || "Unnamed product";
  return {
    id: firstOf(of.spl_set_id, name),
    brand: brand || "—",
    generic: generic || "—",
    manufacturer: firstOf(of.manufacturer_name, "—"),
    indicationSnippet: firstOf(rec.indications_and_usage, ""),
    effectiveDate: rec.effective_time || null,
    curated: false,
    url: `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${encodeURIComponent(name)}`,
  };
}

function normalizeCurated(entry) {
  return {
    id: `curated-${entry.brand}`,
    brand: entry.brand,
    generic: entry.generic,
    manufacturer: entry.manufacturer,
    indicationSnippet: `${entry.approvalType} for IgA nephropathy.`,
    effectiveDate: entry.effectiveDate,
    curated: true,
    url: entry.url,
  };
}

// Query openFDA for a specific brand name. Returns [] on any failure —
// callers fall back to the curated record for that brand.
async function fetchBrand(brand, apiKeyParam) {
  const search = `openfda.brand_name:"${brand.toUpperCase()}"`;
  const url = `${BASE}?search=${encodeURIComponent(search)}&limit=5${apiKeyParam}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return []; // includes 404 (openFDA's "no matches" response)
    const data = await res.json();
    return (data.results || []).map(normalizeLive);
  } catch {
    return [];
  }
}

export async function getApprovedTherapies() {
  const accessDate = new Date().toISOString();
  const apiKeyParam = process.env.OPENFDA_API_KEY
    ? `&api_key=${process.env.OPENFDA_API_KEY}`
    : "";

  try {
    const results = await Promise.all(
      KNOWN_APPROVED_THERAPIES.map((entry) => fetchBrand(entry.brand, apiKeyParam))
    );

    const items = KNOWN_APPROVED_THERAPIES.map((entry, i) => {
      const liveMatches = results[i];
      if (liveMatches.length > 0) {
        // Prefer the most recently effective label if openFDA has several.
        liveMatches.sort((a, b) => String(b.effectiveDate).localeCompare(String(a.effectiveDate)));
        return liveMatches[0];
      }
      // No live label yet (common right after a new approval) — use the
      // curated record so the platform still shows an accurate answer.
      return normalizeCurated(entry);
    });

    return {
      ok: true,
      source: SOURCES.openfda,
      total: items.length,
      items,
      liveCount: items.filter((i) => !i.curated).length,
      curatedCount: items.filter((i) => i.curated).length,
      error: null,
      accessDate,
    };
  } catch (err) {
    // Total failure (e.g. network down entirely) — fall back to the full
    // curated list rather than showing zero.
    return {
      ok: true,
      source: SOURCES.openfda,
      total: KNOWN_APPROVED_THERAPIES.length,
      items: KNOWN_APPROVED_THERAPIES.map(normalizeCurated),
      liveCount: 0,
      curatedCount: KNOWN_APPROVED_THERAPIES.length,
      error: err.message || "Live fetch failed; showing curated reference list",
      accessDate,
    };
  }
}
