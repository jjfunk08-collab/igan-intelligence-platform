// Shared search logic used by both /api/search (retrieval) and /api/ask
// (optional grounded AI answer). Fetches the same cached source data as the
// rest of the app and scores records against the query. No LLM here — pure,
// deterministic retrieval, so results can never be fabricated.

import { getClinicalTrials } from "./sources/clinicaltrials";
import { getApprovedTherapies } from "./sources/openfda";
import { getPublications } from "./sources/europepmc";
import { getNews } from "./sources/news";

function tokenize(q) {
  return String(q || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 || /\d/.test(t));
}

// Score a haystack string against query tokens. Full-phrase match is a big
// boost; individual token hits add up.
function score(haystack, tokens, phrase) {
  const h = haystack.toLowerCase();
  let s = 0;
  if (phrase && phrase.length >= 3 && h.includes(phrase)) s += 10;
  for (const t of tokens) if (h.includes(t)) s += 2;
  return s;
}

// Intent bias: nudge toward a domain when the query names it.
function intentBonus(type, q) {
  const l = q.toLowerCase();
  if (type === "trial" && /(trial|study|recruit|phase|enroll)/.test(l)) return 2;
  if (type === "therapy" && /(approv|drug|therap|treatment|label|indicat)/.test(l)) return 2;
  if (type === "publication" && /(paper|publicat|research|author|journal|preprint)/.test(l)) return 2;
  if (type === "news" && /(news|announce|headline|press)/.test(l)) return 2;
  return 0;
}

export async function searchRecords(query, perGroup = 6) {
  const q = String(query || "").trim();
  const tokens = tokenize(q);
  const phrase = q.toLowerCase();

  const [trials, therapies, pubs, news] = await Promise.all([
    getClinicalTrials(),
    getApprovedTherapies(),
    getPublications(40),
    getNews(40),
  ]);

  const scoreList = (items, type, toRecord) => {
    if (!tokens.length) return [];
    return items
      .map((it) => {
        const rec = toRecord(it);
        const s = score(rec.haystack, tokens, phrase) + intentBonus(type, q);
        return { ...rec, type, score: s };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, perGroup);
  };

  const trialResults = scoreList(trials.items, "trial", (t) => ({
    title: t.title,
    subtitle: `${t.phase !== "NA" ? t.phase + " · " : ""}${String(t.status).replace(/_/g, " ")} · ${t.sponsor}`,
    url: t.url,
    badge: "Trial",
    meta: t.id,
    haystack: `${t.title} ${t.id} ${t.sponsor} ${String(t.status).replace(/_/g, " ")} ${String(t.phase).replace(/PHASE/gi, "phase ")}`,
  }));

  const therapyResults = scoreList(therapies.items, "therapy", (d) => ({
    title: `${d.brand} (${d.generic})`,
    subtitle: `${d.manufacturer}`,
    url: d.url,
    badge: "Approved",
    meta: "",
    haystack: `${d.brand} ${d.generic} ${d.manufacturer} ${d.indicationSnippet}`,
  }));

  const pubResults = scoreList(pubs.items, "publication", (p) => ({
    title: p.title,
    subtitle: `${p.isPreprint ? "Preprint" : p.journal || "Journal"}`,
    url: p.url,
    badge: p.isPreprint ? "Preprint" : "Paper",
    meta: "",
    haystack: `${p.title} ${p.authors} ${p.journal}`,
  }));

  const newsResults = scoreList(news.items, "news", (n) => ({
    title: n.title,
    subtitle: n.outlet,
    url: n.url,
    badge: "News",
    meta: "",
    haystack: `${n.title} ${n.outlet}`,
  }));

  const groups = [
    { key: "therapy", label: "Approved therapies", items: therapyResults },
    { key: "trial", label: "Clinical trials", items: trialResults },
    { key: "publication", label: "Publications", items: pubResults },
    { key: "news", label: "News", items: newsResults },
  ].filter((g) => g.items.length > 0);

  const total = groups.reduce((sum, g) => sum + g.items.length, 0);
  return { query: q, groups, total };
}
