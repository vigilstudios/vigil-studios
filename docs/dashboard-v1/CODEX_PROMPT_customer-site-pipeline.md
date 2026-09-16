# Codex prompt — close the customer-site pipeline (buy → repo → preview → review → live)

Paste everything below the line into a fresh Codex session opened at
`/Users/belierjavier/Desktop/Vigil Studios/Websites`.

---

You are working in the `vigil-studios` repository (Next.js 16, Supabase, Stripe,
Vercel; `main` deploys www.vigilstudios.co) with the `vigil-leadgen` repository
beside it (Python; the Express template engine). Read
`vigil-studios/docs/dashboard-v1/IMPLEMENTATION_LOG.md` (all 15 Sep 2026
entries, newest first) and `vigil-leadgen/HANDOFF.md` ("Express progress",
"What to do next") before changing anything. Work on a branch, commit per
change, keep CI green (`.github/workflows/ci.yml`: typecheck, lint, tests,
no-secrets build). Do not touch the marketing site (`app/(site)`,
`sections/`, `components/site/`, `lib/site-copy.ts`).

## What already exists — build on it, do not rebuild it

- **Purchase → account**: `lib/vigil/services/orders.ts` (`provisionOrder`),
  `settle.ts`, `webhook.ts`, `reconcile.ts`; jobs in `lib/vigil/jobs.ts`
  (`provisioning_jobs`, idempotency keys, `claim_jobs` lease, `RetryLater`,
  `requeueFailed`, staff email on permanent failure). Tests use
  `lib/vigil/__tests__/fake-admin.ts` (an in-memory supabase-js stand-in).
- **Repository per website**: `order.provision` queues `website.repository`
  → `lib/vigil/services/repository.ts` creates a private GitHub repository
  `client-<org-slug>-<website-id8>` under the `vigilstudios` organization
  (`lib/vigil/providers/github.ts`, `GITHUB_TOKEN`/`GITHUB_OWNER`/
  `GITHUB_REPOSITORY_PREFIX` are set in production) seeded with
  `site/index.html` (the purchased Express template with the business
  name), `content/.gitkeep`, `README.md`, `.gitignore`. The link is a
  `provider_links` row (`resource_kind: repository`) and
  `websites.repository_ref = github:<owner>/<repo>`.
- **Publishing**: `lib/vigil/providers/vercel.ts` (real adapter; `VERCEL_TOKEN`,
  `VERCEL_TEAM_ID`, `DEPLOYMENT_PROVIDER=vercel` set in production; the team is
  on Vercel Pro). `lib/vigil/services/deployment.ts`: `provisionWebsite`
  creates one Vercel project per website with `rootDirectory: "site"` and the
  GitHub repo connected; `deployWebsite` triggers a deployment of `main`
  (`target: production`), `website.deployment.sync` polls it, then attaches
  domains and runs `domain.verify`. The admin website page
  (`app/(vigil)/admin/websites/[websiteId]/page.tsx`) has **Open repository /
  Create repository** and **Deploy live**.
- **Customer preview**: `lib/vigil/presenters.ts` `previewSource` → the
  dashboard (`app/(vigil)/dashboard/page.tsx`, `SiteFrame`) shows
  `live_url` when live, else `preview_url`, else the template capture
  `/express-templates/<slug>.html` labelled "Showing the template your site is
  built from".
- **The brief**: Virtue's onboarding stores `projects.brief` (zod schema in
  `lib/vigil/onboarding/brief.ts`: `basics` (business name, category,
  address, phone, email, hours), `offerings` (noun + sections of items with
  prices), `about`, `brand` (colours mode/primary/secondary, social links),
  `domain`) and uploads in `project_assets` (Supabase Storage; kinds include
  `logo` and `photo`, see `lib/vigil/onboarding/assets.ts`).
  `submitIntake` in `lib/vigil/actions/onboarding.ts` marks
  `intake_completed_at`, moves the project to `in_progress`, emails staff and
  logs `project.intake_notified`.
- **The template engine** (`vigil-leadgen/src/vigil_leadgen/express/`):
  `ExpressInput` (`render.py`) is everything one Express site is built from;
  `content.input_from_dict(payload)` builds it from a dict; each vertical has
  `render(data: ExpressInput, *, strict=False) -> ExpressSite`
  (`restaurant_v1.py`, `retail_v1.py`, `salon_spa_v1.py`, `auto_repair_v1.py`,
  …); `brand.py` derives an accessible palette from the customer's colours;
  the validator refuses invented claims. Showcases are in
  `vigil-leadgen/demos/express/`.

## The gaps to close, in this order

### 1. `main` must never reach the customer's domain on its own (review gate)

Today `provisionSite` connects the GitHub repository to the Vercel project,
so Vercel's Git integration auto-deploys **every push to `main` to
production**. That defeats "Deploy live" and would put half-finished work on
a customer's domain.

- Make production deploy only through Vigil's explicit
  `website.deploy` (`triggerDeployment(..., { environment: "production" })`).
  Do it in the adapter at project creation (and idempotently on existing
  projects): set the project's production branch to a branch Vigil never
  pushes to (for example `live`, via the projects API's git/production-branch
  settings), or otherwise disable automatic production deployments for
  pushes — verify the exact Vercel API shape against the current docs, and
  cover the request shape in `lib/vigil/__tests__/vercel.test.ts`.
- Pushes to `main` should still produce **preview** deployments (that is the
  point of the next gap). If the chosen setting also stops previews, trigger a
  preview deployment of `main` from Vigil instead (see 2).
- Add a migration/backfill path for projects already created (there are
  none in production yet, but write the code so `provisionWebsite` fixes an
  existing project's setting on the next run).

### 2. The customer sees *their* site before it goes live

- After any preview deployment reaches `ready` (`website.deployment.sync`),
  store its URL on `websites.preview_url` (the deployment's own `url`, not
  `<project>.vercel.app`, which serves production). `previewSource` already
  prefers `preview_url` while the site is not live, so the dashboard picks it
  up. Keep the "template" fallback until the first preview exists.
- Add **Deploy preview** next to **Deploy live** on the admin website page:
  `website.deploy` with `environment: "preview"` (the job already carries
  `environment`; make sure the whole chain — trigger, sync, `preview_url` —
  respects it and never attaches domains or touches `live_url` for previews).
- Optional but valuable: a GitHub push to `main` triggering a preview
  automatically (either Vercel's own preview deployments once 1 is in place,
  or a small `POST /api/webhooks/github` push hook that enqueues
  `website.deploy` preview for the matching repository, verified with the
  webhook secret). If you do this, every push shows up in the customer's
  dashboard within a minute or two with no staff action.
- Show the current preview URL and the live URL as links on the admin website
  page; show the deployment list with environment, status, URL, and who
  triggered it.

### 3. The brief lands in the repository automatically

When `submitIntake` completes (and idempotently on a retry or a
reconciliation pass), write the customer's content into the repository's
`content/` via the GitHub contents API (`lib/vigil/providers/github.ts`
already has `ensureRepository`; add a "put files" method that creates or
updates by path with the blob sha):

- `content/brief.json` — **the engine's shape**: a JSON document that
  `vigil_leadgen.express.content.input_from_dict` accepts for the website's
  vertical (`websites.template_slug` → vertical; note the slug/vertical
  naming differs: `auto-services` ↔ `auto_repair_v1`, `salon-spa` ↔
  `salon_spa_v1`, check `showcase.py`/`registry.py` for the mapping). Map:
  `basics.businessName` → `business_name`; category → `category_label`;
  address/phone/email; `hours` days → the `hours: list[str]` lines the engine
  expects; `offerings.sections[].items[]` → `services` (name, price,
  description, group by section); `about` → `about` / `highlights`; brand
  colours → whatever `brand.py` reads; social links → `social_links`. Where
  the engine has no slot for a field, put it under a `vigil_extra` key rather
  than dropping it. Write the mapper in TypeScript in
  `lib/vigil/services/build-content.ts` with unit tests against a full
  sample brief, and add the same sample to `vigil-leadgen` as a test that
  `input_from_dict` accepts the file and the vertical renders it with
  `strict=False`.
- `content/photos/<kind>/<original-name>` — every `project_assets` file
  (download from Storage with the service role), plus `content/logo.<ext>`.
  Reference them from `brief.json` by relative path (`gallery_photos`,
  `hero_photo`, `about_photo` and the logo field) so the engine can inline
  them.
- `content/BRIEF.md` — the brief rendered as prose for a human (business,
  hours, offerings, story, brand, domain answer, files uploaded).
- Never overwrite `site/` here. Record the commit sha on the project (a
  `metadata`/`brief_commit` column via a new migration, or the existing
  `projects.brief.progress` if you prefer no migration) and log an audit event
  `project.content_committed`. Reconciliation (`lib/vigil/services/reconcile.ts`)
  should retry a missing content commit for briefs completed in the last 7
  days, the same way it re-sends the missed staff notification.
- The staff "Onboarding complete" email links to the repository and says the
  content is in `content/`.

### 4. One command builds `site/` from `content/`

In `vigil-leadgen`, add a CLI subcommand (the CLI lives in
`src/vigil_leadgen/cli.py`; existing commands include `orders`):

```
./.venv/bin/vigil-leadgen express build --repo /path/to/client-repo [--strict]
```

It reads `content/brief.json` and `content/photos`, resolves the vertical,
renders with the engine (inlining photos as data URIs the way the showcases
do), writes `site/index.html`, and prints validator warnings. Do not commit
or push from the CLI; the operator (or a Codex build session) reviews and
pushes. Add `content/` handling to `.gitignore`? No — content is part of the
customer's repository on purpose (it is what they own). Document the loop in
the repository README that `repository.ts` seeds:

1. clone `client-<slug>-<id>` → 2. `vigil-leadgen express build --repo .` →
3. edit `site/` as needed → 4. push `main` → preview appears in the
customer's dashboard → 5. customer review → 6. admin **Deploy live**.

### 5. Prove it end to end, then write it down

Run a real purchase on www.vigilstudios.co with a single-use Stripe
promotion code (create a 99.92%-off, `duration: once`, one-redemption coupon in
live mode; Stripe's minimum charge is $0.50 — the owner refunds it after)
and confirm, in order: order provisioned; repository created and seeded;
dashboard shows the template preview; complete Virtue's onboarding with a
photo and a logo; `content/` appears in the repository with `brief.json`
that `express build` renders; push → preview URL in the dashboard;
**Deploy live** → production deployment → `live_url`; pushing to `main`
again does **not** change the live site. Then clean up: cancel the Stripe
subscription, delete the test organization (cascades), the auth user, the
GitHub repository and the Vercel project (add an admin "Delete customer"
action that does all four with a typed confirmation, since there is none),
and log everything in `docs/dashboard-v1/IMPLEMENTATION_LOG.md`.

## Constraints

- Every new failure state must either self-heal in `reconcileOrders` or
  email staff (`STAFF_NOTIFY_EMAIL`). Nothing may fail silently.
- Keep logic in `lib/vigil/services/*` (testable with `FakeAdmin`), not in
  routes or pages. Jobs are idempotent; provider calls are recorded in
  `provider_links` before being repeated.
- Secrets never enter the repository; CI builds with no env.
- Master architecture (`vigil-leadgen/VIGIL_STUDIOS_MASTER_ARCHITECTURE.md`)
  §5: the customer owns `site/` and `content/`; platform code stays out of
  the customer repository.
- `Preserve existing tests`: 135 pass today; add to them, never delete.
