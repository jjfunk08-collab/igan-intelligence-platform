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

// Earliest original ("ORIG") approval ("AP") date from the submissions list.
function firstApprovalDate(submissions) {
  const approvals = (submissions || [])
    .filter((s) => /ORIG/i.test(s.submission_type || "") && /AP/i.test(s.submission_status || ""))
    .map((s) => s.submission_status_date)
    .filter(Boolean)
    .sort();
  return approvals[0] || null;
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
    const rec = (data.results || [])[0];
    if (!rec) return null;

    const product = (rec.products || [])[0] || {};
    return {
      applNo: rec.application_number || null,
      applType: (rec.application_number || "").replace(/[0-9]/g, "") || null, // NDA / BLA / ANDA
      sponsor: rec.sponsor_name || null,
      marketingStatus: product.marketing_status || null,
      dosageForm: product.dosage_form || null,
      route: product.route || null,
      approvalDate: firstApprovalDate(rec.submissions),
      url: dafUrl(rec.application_number),
    };
  } catch {
    return null;
  }
}
