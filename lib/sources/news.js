import { XMLParser } from "fast-xml-parser";
import { REVALIDATE_SECONDS, SOURCES } from "../config";

const UA =
  "Biohaven-IgAN-Intelligence/preview (competitive-intelligence; contact: john.funk@biohaven.com)";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

function textOf(node) {
  if (node == null) return "";
  if (typeof node === "string") return node;
  if (typeof node === "object" && node["#text"] != null) return String(node["#text"]);
  return String(node);
}

// Strip HTML tags that Google News packs into <description>.
function stripHtml(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const doc = parser.parse(xml);
  const rawItems = doc?.rss?.channel?.item || doc?.feed?.entry || [];
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items.map((it) => {
    const title = textOf(it.title);
    // RSS uses <link> text; Atom uses <link href="">.
    let link = textOf(it.link);
    if ((!link || typeof it.link === "object") && it.link?.["@_href"]) {
      link = it.link["@_href"];
    }
    const pubDate = textOf(it.pubDate || it.published || it.updated);
    const outlet = textOf(it.source) || feed.label;
    return {
      id: link || title,
      title: stripHtml(title),
      outlet: stripHtml(outlet),
      date: pubDate || null,
      url: link || SOURCES.news.home,
    };
  });
}

export async function getNews(area, limit = 24) {
  const accessDate = new Date().toISOString();
  try {
    const settled = await Promise.allSettled((area.newsFeeds || []).map(fetchFeed));
    const merged = [];
    const seen = new Set();
    let anyOk = false;

    for (const r of settled) {
      if (r.status !== "fulfilled") continue;
      anyOk = true;
      for (const item of r.value) {
        const key = (item.title || "").toLowerCase().slice(0, 80);
        if (!item.title || seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
      }
    }

    merged.sort((a, b) => {
      const da = a.date ? Date.parse(a.date) : 0;
      const db = b.date ? Date.parse(b.date) : 0;
      return (db || 0) - (da || 0);
    });

    return {
      ok: anyOk,
      source: SOURCES.news,
      total: merged.length,
      items: merged.slice(0, limit),
      error: anyOk ? null : "All feeds failed",
      accessDate,
    };
  } catch (err) {
    return {
      ok: false,
      source: SOURCES.news,
      total: null,
      items: [],
      error: err.message || "Fetch failed",
      accessDate,
    };
  }
}
