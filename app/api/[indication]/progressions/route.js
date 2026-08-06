import { getIndication } from "../../../../lib/config";
import { getNews } from "../../../../lib/sources/news";
import { scoreProgressions } from "../../../../lib/aggregate";

// Refresh at most once per hour at the edge; the client also re-polls hourly.
export const revalidate = 3600;

export async function GET(_req, { params }) {
  const area = getIndication(params.indication);
  if (!area) {
    return json({ items: [], error: "Unknown indication" }, 404);
  }

  try {
    // Pull a wide window and fetch it with an hourly cache so "recent
    // progressions" stays fresh independent of the daily site refresh.
    const news = await getNews(area, 40, { revalidate: 3600 });
    const items = scoreProgressions(news.items, 3);
    return json(
      { indication: area.slug, items, generatedAt: new Date().toISOString() },
      200,
      { "cache-control": "public, s-maxage=3600, stale-while-revalidate=600" }
    );
  } catch (err) {
    return json({ items: [], error: err.message || "Fetch failed" }, 200);
  }
}

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...extraHeaders },
  });
}
