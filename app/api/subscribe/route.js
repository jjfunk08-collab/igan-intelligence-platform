import { NextResponse } from "next/server";
import { getIndication } from "../../../lib/config";
import { addSubscriber, subscriptionsConfigured } from "../../../lib/subscribers";

export async function POST(request) {
  if (!subscriptionsConfigured()) {
    return NextResponse.json(
      { error: "Subscriptions aren't set up yet on this deployment. An admin needs to add UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN." },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email, indication, frequency, dayOfWeek } = body || {};
  const area = getIndication(indication);
  if (!area) return NextResponse.json({ error: "Unknown indication." }, { status: 400 });

  try {
    const record = await addSubscriber({ email, indication, frequency, dayOfWeek });
    return NextResponse.json({ ok: true, email: record.email, frequency: record.frequency });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Could not subscribe." }, { status: 400 });
  }
}
