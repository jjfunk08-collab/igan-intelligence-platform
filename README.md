# Biohaven IgAN Intelligence Platform — Preview

A Biohaven-branded regulatory & competitive-intelligence dashboard for **IgA
Nephropathy (IgAN)**. It auto-updates daily from four public sources, with source
attribution and an access date on every record. Built with Next.js (App Router),
deploys to **Vercel free (Hobby) tier**, and needs **no database and no API keys**.

> Preview scope. This is a working vertical slice — four live sources feeding a
> branded dashboard and a weekly brief. It's structured to grow into the fuller
> multi-source build later.

---

## What's inside

| Section | Source | Endpoint | Key? |
|---|---|---|---|
| Trial landscape | ClinicalTrials.gov v2 | `clinicaltrials.gov/api/v2/studies` | No |
| Approved therapies | openFDA drug labels | `api.fda.gov/drug/label.json` | Optional |
| Publications & preprints | Europe PMC | `ebi.ac.uk/europepmc/webservices/rest/search` | No |
| News & announcements | RSS (Google News) | RSS 2.0 | No |

Pages: `/` dashboard · `/visuals` at-a-glance charts · `/brief` weekly newsletter/digest · `/sources` method & attribution.

---

## The "database"

There is no external database in this preview. Each page fetches live and the
result is cached for 24 hours using Vercel's incremental static regeneration
(ISR). A once-daily cron (`vercel.json`) hits `/api/cron/refresh` to revalidate
the cache so the dashboard stays fresh. This is deliberate: it keeps the preview
free, keyless, and zero-ops. When you're ready to persist history (trend charts,
"what changed since last week"), swap the fetch layer for Postgres — the source
modules in `lib/sources/` already return normalized records, so that's the only
layer that changes.

---

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

No `.env` needed. To raise limits or protect the cron, copy `.env.local.example`
to `.env.local` and fill in what you want (all optional).

---

## Deploy to Vercel (Hobby)

1. Push this folder to a GitHub repo.
2. In Vercel: **New Project → import the repo**. Framework auto-detects as Next.js.
3. Deploy. That's it — no env vars required.
4. The cron in `vercel.json` runs daily at 06:00 UTC. On the Hobby plan, cron
   jobs run **at most once per day**, which matches this app's daily refresh.
   (For hourly freshness later, either upgrade to Pro or ping `/api/cron/refresh`
   from an external free scheduler like GitHub Actions.)

Optional: set `CRON_SECRET` in Vercel project settings to lock the refresh route
to Vercel Cron only.

---

## Automated email briefs (subscribe per indication)

Any `/{indication}/brief` page (e.g. `/igan/brief`, `/graves/brief`,
`/focal-epilepsy/brief`) has a **"Subscribe to this brief"** form. Employees
pick daily / weekly (+ day of week) / monthly, and a single daily cron
(`/api/cron/send-briefs`, see `vercel.json`) checks everyone's cadence and
emails only the people who are due that day — so one cron job serves all
three frequencies.

**Setup (two free services, no code changes needed):**

1. **Subscriber storage — Upstash Redis.** In the Vercel dashboard, go to
   **Storage → Marketplace Database Providers → Upstash** (or create one
   directly at upstash.com) and create a free Redis database. Copy the
   **REST URL** and **REST TOKEN** it gives you into your Vercel project's
   environment variables as `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN`.
2. **Sending email — Resend.** Create a free account at resend.com and copy
   an API key into `RESEND_API_KEY`. For testing, leave `RESEND_FROM` unset
   (emails send from `onboarding@resend.dev`, works for any recipient). For a
   real internal rollout, verify your own sending domain in Resend and set
   `RESEND_FROM` to an address on it, e.g.
   `"Biohaven Intelligence <briefs@biohaven.com>"`.
3. Set `APP_BASE_URL` to your production URL (e.g. `https://your-app.vercel.app`)
   so the unsubscribe link in every email is correct.
4. Redeploy. That's it — the subscribe form and the daily send cron pick up
   the new env vars automatically.

Until these are set, the subscribe form stays visible but returns a clear
"not configured yet" message instead of failing silently.

**Notes:**
- Each subscriber's email is stored only to send them the brief and to let
  them unsubscribe (one-click link in every email) — it's never displayed
  anywhere in the app UI.
- The cron is scheduled for `0 13 * * *` (13:00 UTC / ~9am ET) in
  `vercel.json` — change the hour to suit your team, but keep it to once a
  day since Hobby-plan cron jobs can't run more often and the send logic
  already handles all three cadences from one daily run.
- To test without waiting for the schedule, hit
  `/api/cron/send-briefs` directly in a browser (or with `curl`, adding the
  `Authorization: Bearer <CRON_SECRET>` header if you've set one).

---

## Project structure

```
app/
  layout.js            root layout, fonts, masthead + footer
  page.js              dashboard (trials, approvals, publications, news)
  visuals/page.js      at-a-glance charts (phase mix, status, sponsors, pub volume)
  brief/page.js        weekly brief / newsletter digest (+ copy-as-text)
  sources/page.js      source registry, method, compliance notes
  api/cron/refresh/    daily ISR revalidation endpoint
lib/
  config.js            brand, company, indication, source metadata
  format.js            date/citation/text helpers
  aggregate.js         turns raw records into chart-ready summaries
  sources/             one client per source (normalized output + error handling)
components/            masthead, footer, ui (badges/tags), trials explorer, copy button
components/charts/     recharts-based visuals (phase bar, status donut, sponsor leaderboard, pub trend)
public/logos/          official Biohaven wordmark SVGs
```

---

## Branding

Uses the official Biohaven wordmark SVGs and the brand palette: Dark Navy
`#002A61` (dominant), Bright Green `#58BD2B` (accent). The reverse-white logo sits
on the navy masthead per the brand guide. To change the displayed legal entity,
developer name, tagline, or tracked indication, edit `lib/config.js`.

> Legal entity note: the footer currently reads **Biohaven Ltd.** (the former
> "Biohaven Pharmaceutical Holding Company Ltd." was acquired by Pfizer in 2022).
> Confirm the intended name with Brand/Legal and edit `COMPANY.legalName`.

---

## Re-pointing at another indication

Change `AREA` in `lib/config.js` (label + query terms). Every source uses those
terms, so the whole platform re-scopes from one place.

---

## Compliance

Public sources only. openFDA excludes patient PII by design; trial and literature
data are aggregate/bibliographic. No patient names or employee personal
information are stored or displayed. For research/CI use only — not promotional,
not medical advice.

