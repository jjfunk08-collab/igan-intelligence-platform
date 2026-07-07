import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// Triggered daily by Vercel Cron (see vercel.json). Revalidates the ISR
// cache for every page so the next visitor gets fresh data.
// If CRON_SECRET is set, only requests bearing it are honored.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const paths = ["/", "/brief", "/sources"];
  paths.forEach((p) => revalidatePath(p));

  return NextResponse.json({
    ok: true,
    revalidated: paths,
    at: new Date().toISOString(),
  });
}
