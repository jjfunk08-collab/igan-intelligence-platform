import { REVALIDATE_SECONDS, SOURCES } from "../config";

const BASE = "https://clinicaltrials.gov/api/v2/studies";
const UA =
  "Biohaven-IgAN-Intelligence/preview (competitive-intelligence; contact: john.funk@biohaven.com)";

function pick(obj, path, fallback) {
  return path.reduce(
    (acc, key) => (acc && acc[key] != null ? acc[key] : undefined),
    obj
  ) ?? fallback;
}

function computeDurationMonths(start, end) {
  if (!start || !end) return null;
  const a = new Date(start), b = new Date(end);
  if (isNaN(a) || isNaN(b)) return null;
  const months = Math.round((b - a) / (1000 * 60 * 60 * 24 * 30.44));
  return months > 0 ? months : null;
}

function normalize(study) {
  const p = study.protocolSection || {};
  const nctId = pick(p, ["identificationModule", "nctId"], "");
  const phases = pick(p, ["designModule", "phases"], []) || [];
  const interventions = pick(p, ["armsInterventionsModule", "interventions"], []) || [];
  const drugNames = interventions
    .filter((i) => /drug|biological/i.test(i.type || ""))
    .map((i) => i.name)
    .filter(Boolean);
  const primaryOutcomes = pick(p, ["outcomesModule", "primaryOutcomes"], []) || [];
  const sponsor = pick(p, ["sponsorCollaboratorsModule", "leadSponsor", "name"], "—");
  const startDate = pick(p, ["statusModule", "startDateStruct", "date"], null);
  const primaryCompletion = pick(p, ["statusModule", "primaryCompletionDateStruct", "date"], null);
  const completion = pick(p, ["statusModule", "completionDateStruct", "date"], null);
  const elig = p.eligibilityModule || {};

  // Google search scoped to the sponsor's press release for this program.
  const pressQuery = encodeURIComponent(`${sponsor} ${drugNames[0] || ""} press release`.trim());

  return {
    id: nctId,
    title: pick(p, ["identificationModule", "briefTitle"], "Untitled study"),
    status: pick(p, ["statusModule", "overallStatus"], "UNKNOWN"),
    phase: phases.length ? phases.join(" / ") : "NA",
    phaseKey: phases[0] || "NA",
    enrollment: pick(p, ["designModule", "enrollmentInfo", "count"], null),
    sponsor,
    intervention: drugNames[0] || null,
    lastUpdate: pick(p, ["statusModule", "lastUpdatePostDateStruct", "date"], null),
    startDate,
    completionDate: primaryCompletion || completion,
    durationMonths: computeDurationMonths(startDate, primaryCompletion || completion),
    primaryEndpoint: primaryOutcomes[0] ? primaryOutcomes[0].measure : null,
    minAge: elig.minimumAge || null,
    maxAge: elig.maximumAge || null,
    sex: elig.sex || null,
    url: nctId ? `https://clinicaltrials.gov/study/${nctId}` : SOURCES.clinicaltrials.home,
    pressUrl: `https://www.google.com/search?q=${pressQuery}`,
  };
}

export async function getClinicalTrials(area, limit = 1000) {
  const accessDate = new Date().toISOString();
  const params = new URLSearchParams({
    "query.cond": area.condition,
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
