# YPPReady

**Prepare. Practice. Perform.** / *Préparez-vous. Entraînez-vous. Réussissez.*

YPPReady is an independent, unaffiliated bilingual (English/French) preparation platform for
candidates applying to Young Professional Programs (YPPs) at international development
organizations (African Development Bank, World Bank Group, IMF, United Nations, and other
regional development banks). It is not affiliated with, endorsed by, or sponsored by any of
these institutions — see the disclaimer in the footer of every page.

The app covers the full preparation loop: a diagnostic test, timed mock assessments across
seven reasoning categories, short lessons on development topics and on individual
organizations, an interview-preparation module with a STAR answer builder and mock interview
modes, a transparent internal "Readiness Score," a daily practice challenge, and a simple
admin panel for managing question/lesson/interview content in both languages.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **@libsql/client** — a SQLite-compatible database layer: a local file in development
  (zero-config), or a hosted [Turso](https://turso.tech) database in production, so the app can
  run on hosts with no persistent disk (see "Deploying YPPReady online" below)
- Custom cookie-based auth (bcryptjs + signed JWT session cookies via `jose`) — no third-party
  auth provider
- Custom i18n — plain dictionary objects (`src/lib/i18n/en.ts` / `fr.ts`), no i18n framework
- React 19 Server Actions for all forms and mutations (no separate REST API layer)

Runs locally with no external services or API keys required. Deploying it online for real users
needs two free accounts (a hosted database and a hosting platform) — see below.

## Getting started

```bash
npm install
npm run seed     # creates the SQLite DB, seeds all practice content, creates demo accounts
npm run dev      # http://localhost:3000
```

For a production build:

```bash
npm run build
npm run start
```

### Demo accounts

Created by `npm run seed`:

| Role  | Email                    | Password        |
|-------|--------------------------|------------------|
| Admin | `admin@yppready.app`     | `YppReady2026!`  |
| Demo  | `demo@yppready.app`      | `Demo2026!`      |

The admin account can manage assessment questions, lessons, and interview questions at
`/admin`. You can also sign up as a new user through the normal `/signup` flow.

### Environment variables

None are required to run locally — sensible defaults are used (an insecure session secret, a
local SQLite file). See `.env.example` for the full list. Before deploying anywhere real, set:

```bash
SESSION_SECRET=<a long random string>
TURSO_DATABASE_URL=<from your Turso database>
TURSO_AUTH_TOKEN=<from your Turso database>
```

`SESSION_SECRET` signs the session cookie. Without it, the app falls back to an insecure
built-in default (fine for local evaluation, logged as a warning on startup, **not safe for
production**). `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` point the app at a hosted database instead
of the local SQLite file — required on any host without a persistent disk (see below).

## Deploying YPPReady online (free)

The app is designed to run for free on **[Turso](https://turso.tech)** (hosted database) +
**[Render](https://render.com)** (web hosting). Both have genuine free tiers with no credit card
required, which is why this pairing was chosen over alternatives (Vercel's free "Hobby" plan is
restricted to non-commercial personal use; Fly.io no longer offers a real free tier for new
accounts). Free-tier limitations to know about going in: Render's free web service goes to sleep
after 15 minutes of no traffic and takes ~30–60 seconds to wake back up on the next visit; Turso's
free tier is generous (500 million row reads and 10 million row writes per month) and unlikely to
be a real constraint at this stage.

**1. Create a Turso database**

- Sign up at [turso.tech](https://turso.tech) (free, no card required).
- Install the CLI and log in: `curl -sSfL https://get.tur.so/install.sh | bash`, then `turso auth login`.
- Create the database: `turso db create yppready`
- Get the two values the app needs:
  - `turso db show yppready --url` → `TURSO_DATABASE_URL`
  - `turso db tokens create yppready` → `TURSO_AUTH_TOKEN`

**2. Seed the hosted database once**

From your machine, with those two values set as environment variables, run the seeder against the
real database (instead of the local file):

```bash
TURSO_DATABASE_URL=<your url> TURSO_AUTH_TOKEN=<your token> npm run seed
```

You only need to do this once (it's safe to re-run later if you add content — it upserts by id).

**3. Push the code to GitHub**

Render deploys from a GitHub repository. Create a new (private is fine) repo on GitHub and push
this project to it if you haven't already.

**4. Create the Render web service**

- Sign up at [render.com](https://render.com) (free, no card required for the free plan).
- New → Blueprint → connect your GitHub repo. Render reads `render.yaml` (included in this
  project) and proposes a free web service.
- When prompted, fill in the three secret environment variables: `SESSION_SECRET` (any long
  random string — `openssl rand -hex 32` generates one), `TURSO_DATABASE_URL`, and
  `TURSO_AUTH_TOKEN` (the two values from step 1).
- Deploy. The first build takes a few minutes; after that, your site is live at the `.onrender.com`
  URL Render gives you.

Every future `git push` to the connected branch redeploys automatically.

## Seed content

`npm run seed` is idempotent (safe to re-run) and populates:

- 50 assessment questions across Numerical Reasoning, Verbal Reasoning, Logical Reasoning,
  Situational Judgment, and Development Knowledge (10 each), fully bilingual
- 10 general development-knowledge lessons + 22 organization-specific lessons (7 for AfDB —
  including its president's stated vision and flagship projects across Africa — and 5 each for
  World Bank, IMF, UN), fully bilingual
- 30 interview-preparation questions across behavioral, motivational, and organization-specific
  categories, fully bilingual

All practice questions are original content clearly labeled as practice material — see
**Content & trust** below. Organization-knowledge lessons are based on publicly available
information and carry a "Last updated" date; nothing is presented as verified, official, or
current recruitment criteria.

## Content & trust

This platform never claims to reproduce real recruitment questions, leaked materials, or
official scoring criteria. All practice content is labeled "Practice Question" or "YPP-style
Practice," organization facts are labeled as based on publicly available information with a
last-updated date, and the internal "Readiness Score" is explicitly described (in the app) as
a self-assessment tool, not an official recruitment score or a guarantee of outcome.

## Testing

A set of Playwright end-to-end smoke tests lives in `scripts/`. They run against a live
server (dev or production) at `http://localhost:3000`:

```bash
npm run dev   # or: npm run build && npm run start
# in another terminal:
node scripts/smoke-full.mjs         # full user journey: signup → onboarding → diagnostic →
                                     # results → dashboard → learn → organizations → interview →
                                     # progress → today → language switch → admin access control
node scripts/smoke-interview.mjs    # STAR builder save/reload/feedback, mock interview flow
node scripts/smoke-admin.mjs        # admin CRUD (create/edit/delete) for interview questions
node scripts/smoke-mobile-i18n.mjs  # 375px responsive check + French-language completeness
node scripts/smoke-auth.mjs         # signup → onboarding redirect
node scripts/smoke-afdb-real.mjs    # AfDB format notice (dashboard/hub), real 45-minute
                                     # "AfDB Real Assessment Simulation" mode end-to-end,
                                     # Learn hub tabs/accordion, Situational Judgment guide page
```

Or run the whole suite in one go: `npm run smoke` (requires a live server on `http://localhost:3000`,
started separately).

These tests create their own throwaway accounts/records; re-run `npm run seed` afterwards
(or delete `data/ypp.db` and reseed) if you want a pristine database again.

## Project structure

```
src/
  app/            Routes (App Router) and Server Actions (src/app/actions/)
  components/     UI primitives, layout, and feature components
  lib/
    db/           Database connection (@libsql/client), schema, and per-domain repositories
    i18n/         English/French dictionaries and helpers
    auth.ts       Session/auth helpers
    scoring.ts    Readiness Score model
    interviewScoring.ts  Heuristic STAR-answer feedback
  data/seed/      Seed content (questions, lessons, interview questions) as JSON
scripts/
  seed.ts         Database seeder
  smoke-*.mjs     Playwright end-to-end tests
render.yaml       Render Blueprint (see "Deploying YPPReady online")
.env.example      Environment variables reference
```

## Disclaimer

YPPReady is an independent study-preparation tool created by a third party. It is **not**
affiliated with, endorsed by, or sponsored by the African Development Bank, the World Bank
Group, the International Monetary Fund, the United Nations, or any other organization
referenced in this application. All organizational information is based on publicly
available sources and may not reflect current recruitment processes. Use of this platform
does not guarantee selection for any program.
