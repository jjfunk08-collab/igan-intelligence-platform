import { REVALIDATE_SECONDS } from "../config";

// Interfaces with Drugs@FDA via the openFDA drugsfda.json endpoint.
// Returns official application number, sponsor, first-approval date, and a
// direct link to the Drugs@FDA record — the regulatory-grade approval data
// requested in review feedback.

const BASE = "https://api.fda.gov/drug/drugsfda.json";
const UA =
  "Biohaven-CompRegIntel/preview (competitive-intelligence; contact: john.funk@biohaven.com)";

// Build the public Drugs@FDA overview URL from an application number like
// "BLA761143" or "NDA212018" (strip the letter prefix for ApplNo).
function dafUrl(applicationNumber) {
  const num = String(applicationNumber || "").replace(/[^0-9]/g, "");
  return num
    ? `https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=${num}`
    : "https://www.accessdata.fda.gov/scripts/cder/daf/";
}

// The drug's ORIGINAL approval date: the ORIG submission with the lowest
// submission number that reached "AP" (approved) status. This deliberately
// ignores supplements (SUPPL) and later ORIG amendments, which can otherwise
// make the date look earlier/later than the actual first drug approval.
function originalApprovalDate(submissions) {
  const origAP = (submissions || [])
    .filter((s) => /ORIG/i.test(s.submission_type || "") && /AP/i.test(s.submission_status || ""))
    .map((s) => ({ num: parseInt(s.submission_number, 10) || 1, date: s.submission_status_date }))
    .filter((s) => s.date);
  if (!origAP.length) return null;
  origAP.sort((a, b) => a.num - b.num || String(a.date).localeCompare(String(b.date)));
  return origAP[0].date;
}

// Among the records a brand search returns, pick the one that actually carries
// the drug's original approval (earliest ORIG approval), rather than an
// arbitrary first result that may be a supplemental or secondary application.
function pickOriginalRecord(results) {
  const scored = (results || [])
    .map((rec) => ({ rec, date: originalApprovalDate(rec.submissions) }))
    .filter((x) => x.date);
  if (scored.length) {
    scored.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return scored[0].rec;
  }
  return (results || [])[0] || null;
}

export async function fetchDrugsAtFdaByBrand(brand, apiKeyParam = "") {
  const search = `products.brand_name:"${String(brand).toUpperCase()}"`;
  const url = `${BASE}?search=${encodeURIComponent(search)}&limit=5${apiKeyParam}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null; // 404 = no match
    const data = await res.json();
    const rec = pickOriginalRecord(data.results);
    if (!rec) return null;

    const product = (rec.products || [])[0] || {};
    return {
      applNo: rec.application_number || null,
      applType: (rec.application_number || "").replace(/[0-9]/g, "") || null, // NDA / BLA / ANDA
      sponsor: rec.sponsor_name || null,
      marketingStatus: product.marketing_status || null,
      dosageForm: product.dosage_form || null,
      route: product.route || null,
      approvalDate: originalApprovalDate(rec.submissions),
      url: dafUrl(rec.application_number),
    };
  } catch {
    return null;
  }
}
