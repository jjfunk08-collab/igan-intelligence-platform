import { NextResponse } from "next/server";
import { listIndications, getIndication } from "../../../../lib/config";
import { getBriefData, buildBriefText, buildBriefHtml } from "../../../../lib/briefContent";
import { listSubscribers, isDue, markSent, subscriptionsConfigured } from "../../../../lib/subscribers";
import { sendEmail, emailConfigured } from "../../../../lib/sendEmail";

// Runs once a day (see vercel.json). Each subscriber picks daily / weekly
// (+ day of week) / monthly; isDue() decides who actually gets an email
// today, so a single daily cron correctly serves every cadence.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!subscriptionsConfigured() || !emailConfigured()) {
    return NextResponse.json({
      ok: false,
      error: "Not configured — set UPSTASH_REDIS_REST_URL/TOKEN and RESEND_API_KEY to enable automated briefs.",
    });
  }

  const siteBase = process.env.APP_BASE_URL || `https://${request.headers.get("host")}`;
  const now = new Date();
  const results = [];

  for (const area of listIndications()) {
    let due;
    try {
      const subs = await listSubscribers(area.slug);
      due = subs.filter((s) => isDue(s, now));
    } catch (err) {
      results.push({ indication: area.slug, error: err.message });
      continue;
    }
    if (!due.length) {
      results.push({ indication: area.slug, sent: 0 });
      continue;
    }

    // Fetch this indication's brief data once, reuse for every subscriber.
    const data = await getBriefData(area);
    const text = buildBriefText({ area, ...data });
    let sent = 0;
    const errors = [];

    for (const sub of due) {
      const unsubscribeUrl = `${siteBase}/api/unsubscribe?token=${sub.token}&i=${area.slug}`;
      const html = buildBriefHtml({ area, ...data }, { unsubscribeUrl, siteUrl: `${siteBase}/${area.slug}/brief` });
      try {
        await sendEmail({
          to: sub.email,
          subject: `This Week in ${area.label} — ${data.issueDate}`,
          html,
          text: `${text}\n\nUnsubscribe: ${unsubscribeUrl}`,
        });
        await markSent(area.slug, sub.token, sub);
        sent += 1;
      } catch (err) {
        errors.push({ email: sub.email, error: err.message });
      }
    }
    results.push({ indication: area.slug, due: due.length, sent, errors: errors.length ? errors : undefined });
  }

  return NextResponse.json({ ok: true, at: now.toISOString(), results });
}
