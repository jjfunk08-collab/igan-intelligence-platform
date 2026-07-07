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

Pages: `/` dashboard · `/brief` weekly newsletter/digest · `/sources` method & attribution.

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

## Project structure

```
app/
  layout.js            root layout, fonts, masthead + footer
  page.js              dashboard (trials, approvals, publications, news)
  brief/page.js        weekly brief / newsletter digest (+ copy-as-text)
  sources/page.js      source registry, method, compliance notes
  api/cron/refresh/    daily ISR revalidation endpoint
lib/
  config.js            brand, company, indication, source metadata
  format.js            date/citation/text helpers
  sources/             one client per source (normalized output + error handling)
components/            masthead, footer, ui (badges/tags), trials explorer, copy button
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

*Developed by John Funk.*
