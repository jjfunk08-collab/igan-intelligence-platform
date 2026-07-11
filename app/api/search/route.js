import { NextResponse } from "next/server";
import { searchRecords } from "../../../lib/search";

// Grounded retrieval search. Returns matching records only — no generated text.
export async function GET(request) {
  const q = request.nextUrl.searchParams.get("q") || "";
  if (q.trim().length < 2) {
    return NextResponse.json({ query: q, groups: [], total: 0 });
  }
  try {
    const results = await searchRecords(q, 6);
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json(
      { query: q, groups: [], total: 0, error: err.message || "Search failed" },
      { status: 200 }
    );
  }
}
