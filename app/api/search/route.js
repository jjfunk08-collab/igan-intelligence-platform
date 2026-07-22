import { NextResponse } from "next/server";
import { searchRecords } from "../../../lib/search";
import { getIndication, INDICATIONS } from "../../../lib/config";

const DEFAULT = Object.keys(INDICATIONS)[0];

export async function GET(request) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const slug = request.nextUrl.searchParams.get("area") || DEFAULT;
  const area = getIndication(slug) || getIndication(DEFAULT);

  if (q.trim().length < 2) {
    return NextResponse.json({ query: q, area: area.slug, groups: [], total: 0 });
  }
  try {
    const results = await searchRecords(area, q, 6);
    return NextResponse.json({ ...results, area: area.slug });
  } catch (err) {
    return NextResponse.json(
      { query: q, area: area.slug, groups: [], total: 0, error: err.message || "Search failed" },
      { status: 200 }
    );
  }
}
