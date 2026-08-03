import { REVALIDATE_SECONDS, SOURCES } from "../config";

// Pulls the latest FDA drug label (SPL) per known therapy so labels can be
// compared side by side — indications, dosage, and label date, each linked to
// the full label on DailyMed.

const BASE = "https://api.fda.gov/drug/label.json";
const UA =
  "Biohaven-CompRegIntel/preview (competitive-intelligence; contact: john.funk@biohaven.com)";

function excerpt(arr, n = 240) {
  const t = Array.isArray(arr) ? arr[0] : arr;
  if (!t) return null;
  const clean = String(t).replace(/\s+/g, " ").trim();
  return clean.length > n ? clean.slice(0, clean.lastIndexOf(" ", n)).trim() + "…" : clean;
}

async function fetchLabel(brand, keyParam) {
  const search = `openfda.brand_name:"${String(brand).toUpperCase()}"`;
  const url = `${BASE}?search=${encodeURIComponent(search)}&limit=1&sort=effective_time:desc${keyParam}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rec = (data.results || [])[0];
    if (!rec) return null;
    const setid = rec.openfda && rec.openfda.spl_set_id ? rec.openfda.spl_set_id[0] : null;
    return {
      labelDate: rec.effective_time || null,
      indications: excerpt(rec.indications_and_usage),
      dosage: excerpt(rec.dosage_and_administration),
      url: setid
        ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setid}`
        : `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${encodeURIComponent(brand)}`,
    };
  } catch {
    return null;
  }
}

export async function getLabelComparison(area) {
  const accessDate = new Date().toISOString();
  const known = area?.knownApprovedTherapies || [];
  const keyParam = process.env.OPENFDA_API_KEY ? `&api_key=${process.env.OPENFDA_API_KEY}` : "";
  try {
    const results = await Promise.all(known.map((e) => fetchLabel(e.brand, keyParam)));
    const items = known.map((e, i) => {
      const l = results[i];
      return {
        id: `${area.slug}-label-${e.brand}`,
        brand: e.brand,
        generic: e.generic,
        hasLabel: !!l,
        labelDate: l ? l.labelDate : null,
        indications: l ? l.indications : null,
        dosage: l ? l.dosage : null,
        url: l ? l.url : `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${encodeURIComponent(e.brand)}`,
      };
    });
    // Labeled first, newest label first.
    items.sort((a, b) => Number(b.hasLabel) - Number(a.hasLabel) || String(b.labelDate).localeCompare(String(a.labelDate)));
    return { ok: true, source: SOURCES.openfda, items, accessDate };
  } catch (err) {
    return { ok: false, source: SOURCES.openfda, items: [], error: err.message || "Fetch failed", accessDate };
  }
}
