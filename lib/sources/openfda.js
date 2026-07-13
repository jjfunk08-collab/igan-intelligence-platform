import { REVALIDATE_SECONDS, SOURCES } from "../config";
import { fetchDrugsAtFdaByBrand } from "./drugsfda";

// Approved therapies for a given indication. Each known therapy is enriched
// live from Drugs@FDA (application number, sponsor, first-approval date, and a
// direct Drugs@FDA link). If Drugs@FDA has no match yet (common right after a
// new approval), the curated record is shown instead, clearly marked.

export async function getApprovedTherapies(area) {
  const accessDate = new Date().toISOString();
  const known = area?.knownApprovedTherapies || [];
  const apiKeyParam = process.env.OPENFDA_API_KEY
    ? `&api_key=${process.env.OPENFDA_API_KEY}`
    : "";

  try {
    const dafResults = await Promise.all(
      known.map((entry) => fetchDrugsAtFdaByBrand(entry.brand, apiKeyParam))
    );

    const items = known.map((entry, i) => {
      const daf = dafResults[i];
      const live = !!daf;
      return {
        id: `${area.slug}-${entry.brand}`,
        brand: entry.brand,
        generic: entry.generic,
        manufacturer: (daf && daf.sponsor) || entry.manufacturer,
        indicationSnippet: `${entry.approvalType} for ${area.label}.`,
        effectiveDate: (daf && daf.approvalDate) || entry.effectiveDate,
        applNo: daf ? daf.applNo : null,
        applType: daf ? daf.applType : null,
        marketingStatus: daf ? daf.marketingStatus : null,
        drugsFdaUrl: daf ? daf.url : null,
        live,
        url: (daf && daf.url) || entry.url,
      };
    });

    // Newest first.
    items.sort((a, b) => String(b.effectiveDate).localeCompare(String(a.effectiveDate)));

    return {
      ok: true,
      source: SOURCES.drugsfda,
      total: items.length,
      items,
      liveCount: items.filter((i) => i.live).length,
      curatedCount: items.filter((i) => !i.live).length,
      error: null,
      accessDate,
    };
  } catch (err) {
    // Full failure — show curated list rather than nothing.
    const items = known.map((entry) => ({
      id: `${area.slug}-${entry.brand}`,
      brand: entry.brand,
      generic: entry.generic,
      manufacturer: entry.manufacturer,
      indicationSnippet: `${entry.approvalType} for ${area.label}.`,
      effectiveDate: entry.effectiveDate,
      applNo: null, applType: null, marketingStatus: null, drugsFdaUrl: null,
      live: false,
      url: entry.url,
    }));
    return {
      ok: true, source: SOURCES.drugsfda, total: items.length, items,
      liveCount: 0, curatedCount: items.length,
      error: err.message || "Live fetch failed; showing curated reference list",
      accessDate,
    };
  }
}
