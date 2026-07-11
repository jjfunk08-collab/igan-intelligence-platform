import { AREA, REVALIDATE_SECONDS, SOURCES } from "../config";

const BASE = "https://clinicaltrials.gov/api/v2/studies";
const UA =
  "Biohaven-IgAN-Intelligence/preview (competitive-intelligence; contact: john.funk@biohaven.com)";

function pick(obj, path, fallback) {
  return path.reduce(
    (acc, key) => (acc && acc[key] != null ? acc[key] : undefined),
    obj
  ) ?? fallback;
}

function normalize(study) {
  const p = study.protocolSection || {};
  const nctId = pick(p, ["identificationModule", "nctId"], "");
  const phases = pick(p, ["designModule", "phases"], []) || [];
  return {
    id: nctId,
    title: pick(p, ["identificationModule", "briefTitle"], "Untitled study"),
    status: pick(p, ["statusModule", "overallStatus"], "UNKNOWN"),
    phase: phases.length ? phases.join(" / ") : "NA",
    phaseKey: phases[0] || "NA",
    enrollment: pick(p, ["designModule", "enrollmentInfo", "count"], null),
    sponsor: pick(p, ["sponsorCollaboratorsModule", "leadSponsor", "name"], "—"),
    lastUpdate: pick(p, ["statusModule", "lastUpdatePostDateStruct", "date"], null),
    url: nctId ? `https://clinicaltrials.gov/study/${nctId}` : SOURCES.clinicaltrials.home,
  };
}

export async function getClinicalTrials(limit = 1000) {
  const accessDate = new Date().toISOString();
  const params = new URLSearchParams({
    "query.cond": AREA.condition,
    pageSize: String(Math.min(limit, 1000)), // 1000 is the API's documented max per page
    countTotal: "true",
    sort: "LastUpdatePostDate:desc",
  });

  try {
    const res = await fetch(`${BASE}?${params.toString()}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const items = (data.studies || []).map(normalize).filter((t) => t.id);
    // Defensive re-sort by last update (API sort is best-effort).
    items.sort((a, b) => String(b.lastUpdate).localeCompare(String(a.lastUpdate)));
    return {
      ok: true,
      source: SOURCES.clinicaltrials,
      total: typeof data.totalCount === "number" ? data.totalCount : items.length,
      items,
      error: null,
      accessDate,
    };
  } catch (err) {
    return {
      ok: false,
      source: SOURCES.clinicaltrials,
      total: null,
      items: [],
      error: err.message || "Fetch failed",
      accessDate,
    };
  }
}
