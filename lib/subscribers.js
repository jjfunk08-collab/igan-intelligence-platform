// Subscriber storage backed by Upstash Redis's REST API. We talk to it with
// plain fetch — no SDK dependency required. Requires two env vars:
//   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
// (Free tier: create one at https://vercel.com/marketplace → Upstash, or
// directly at https://upstash.com — either way you get these two values.)
//
// Data model: one Redis HASH per indication, `subscribers:{slug}`, mapping
// an unsubscribe token -> a JSON-encoded subscriber record:
//   { email, indication, frequency, dayOfWeek, createdAt, lastSentAt, token }
//
// GDPR note: this is the ONLY place subscriber emails are stored. They are
// never rendered in the app UI — only used server-side to send the brief
// and to let a person remove themselves via the unsubscribe link.

import { randomUUID } from "crypto";

const URL_ = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export function subscriptionsConfigured() {
  return !!(URL_ && TOKEN);
}

async function redis(command) {
  if (!subscriptionsConfigured()) {
    throw new Error(
      "Subscriptions are not configured yet — set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
    );
  }
  const res = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `Redis error (${res.status})`);
  return data.result;
}

const FREQUENCIES = ["daily", "weekly", "monthly"];
const key = (slug) => `subscribers:${slug}`;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export async function addSubscriber({ email, indication, frequency = "weekly", dayOfWeek = 1 }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!isValidEmail(cleanEmail)) throw new Error("Enter a valid email address.");
  if (!FREQUENCIES.includes(frequency)) throw new Error("Invalid frequency.");

  // De-dupe: same email + indication shouldn't create two active rows.
  const existing = await listSubscribers(indication);
  const dup = existing.find((s) => s.email === cleanEmail);
  if (dup) {
    // Update preferences on the existing subscription rather than duplicating.
    const updated = { ...dup, frequency, dayOfWeek };
    await redis(["HSET", key(indication), dup.token, JSON.stringify(updated)]);
    return updated;
  }

  const record = {
    email: cleanEmail,
    indication,
    frequency,
    dayOfWeek, // 0=Sun..6=Sat, only used when frequency === "weekly"
    createdAt: new Date().toISOString(),
    lastSentAt: null,
    token: randomUUID(),
  };
  await redis(["HSET", key(indication), record.token, JSON.stringify(record)]);
  return record;
}

export async function removeSubscriber(indication, token) {
  await redis(["HDEL", key(indication), token]);
}

export async function listSubscribers(indication) {
  const flat = await redis(["HGETALL", key(indication)]); // [field, value, field, value, ...]
  const out = [];
  for (let i = 0; i < flat.length; i += 2) {
    try {
      out.push(JSON.parse(flat[i + 1]));
    } catch {
      /* skip corrupt row */
    }
  }
  return out;
}

export async function markSent(indication, token, record) {
  const updated = { ...record, lastSentAt: new Date().toISOString() };
  await redis(["HSET", key(indication), token, JSON.stringify(updated)]);
}

// A subscriber is "due" at most once per UTC calendar day, on the cadence
// they picked. The cron can run daily (or more often) and this stays safe.
export function isDue(sub, now = new Date()) {
  const today = now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const lastDay = sub.lastSentAt ? sub.lastSentAt.slice(0, 10) : null;
  if (lastDay === today) return false; // already sent today — don't double-send

  if (sub.frequency === "daily") return true;
  if (sub.frequency === "weekly") return now.getUTCDay() === (sub.dayOfWeek ?? 1);
  if (sub.frequency === "monthly") return now.getUTCDate() === 1;
  return false;
}
