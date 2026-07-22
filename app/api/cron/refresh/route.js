import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { listIndications } from "../../../../lib/config";

// Daily Vercel Cron. Revalidates the portfolio hub and every indication page.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const sub = ["", "/trials", "/therapies", "/publications", "/news", "/visuals", "/brief", "/sources"];
  const paths = ["/"];
  for (const ind of listIndications()) {
    for (const s of sub) paths.push(`/${ind.slug}${s}`);
  }
  paths.forEach((p) => revalidatePath(p));

  return NextResponse.json({ ok: true, revalidated: paths, at: new Date().toISOString() });
}
