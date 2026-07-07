import { REVALIDATE_SECONDS, SOURCES } from "../config";

const BASE = "https://api.fda.gov/drug/label.json";
const UA =
  "Biohaven-IgAN-Intelligence/preview (competitive-intelligence; contact: john.funk@biohaven.com)";

function firstOf(arr, fallback = "—") {
  return Array.isArray(arr) && arr.length ? arr[0] : fallback;
}

function normalize(rec) {
  const of = rec.openfda || {};
  const brand = firstOf(of.brand_name, null);
  const generic = firstOf(of.generic_name, null);
  const name = brand || generic || "Unnamed product";
  return {
    id: firstOf(of.spl_set_id, name),
    brand: brand || "—",
    generic: generic || "—",
    manufacturer: firstOf(of.manufacturer_name, "—"),
    route: firstOf(of.route, ""),
    indicationSnippet: firstOf(rec.indications_and_usage, ""),
    effectiveDate: rec.effective_time || null,
    // DailyMed search is a reliable, human-friendly destination for the label.
    url: `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${encodeURIComponent(
      name
    )}`,
  };
}

export async function getApprovedTherapies(limit = 25) {
  const accessDate = new Date().toISOString();
  // Search label indication text for the indication. openFDA has no
  // structured "indication" field, so we search the indications_and_usage text.
  // Quotes must be percent-encoded (%22); phrase words joined with +.
  const search = "indications_and_usage:%22IgA+nephropathy%22";
  const key = process.env.OPENFDA_API_KEY
    ? `&api_key=${process.env.OPENFDA_API_KEY}`
    : "";
  const url = `${BASE}?search=${search}&limit=${limit}${key}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    // openFDA returns 404 when a search yields zero results — treat as empty, not error.
    if (res.status === 404) {
      return {
        ok: true, source: SOURCES.openfda, total: 0, items: [], error: null, accessDate,
      };
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // De-duplicate by brand name (labels have many versions/manufacturers).
    const seen = new Set();
    const items = [];
    for (const rec of data.results || []) {
      const n = normalize(rec);
      const dedupeKey = (n.brand + n.generic).toLowerCase();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      items.push(n);
    }
    items.sort((a, b) =>
      String(b.effectiveDate).localeCompare(String(a.effectiveDate))
    );

    return {
      ok: true,
      source: SOURCES.openfda,
      total: data.meta?.results?.total ?? items.length,
      items,
      error: null,
      accessDate,
    };
  } catch (err) {
    return {
      ok: false,
      source: SOURCES.openfda,
      total: null,
      items: [],
      error: err.message || "Fetch failed",
      accessDate,
    };
  }
}
