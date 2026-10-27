# Dashboard V1 — Implementation Log

Branch: `claude/dashboard-v1-foundation` (in `vigil-studios`). `main` untouched;
production deploys only from `main`.

---

## 2026-09-16 — First sign-in hardening

- Welcome-email tokens now land on an explicit confirmation button instead of
  auto-submitting from the GET response. Inbox security scanners can inspect
  the link without consuming the customer's one-time Supabase token.
- Welcome emails and checkout fallback sign-in links now return new customers
  to `/dashboard`, where Virtue's first-arrival greeting lives. A direct visit
  to onboarding with a brand-new brief also redirects through that greeting;
  choosing **Let's begin** advances the brief and opens the wizard normally.
- Added route coverage proving the confirmation page cannot auto-submit a token
  and still rejects malformed links.

---

## 2026-09-16 — Professional direct checkout and flexible onboarding

- Added a public four-step Virtue walkthrough at `/professional`. It explains
  the exact Professional scope, qualifies the customer's requirements, sends
  standard website work to direct checkout, and routes add-ons or custom
  application needs to a scope call with the Vigil team before payment.
- Centralized the website-tier boundaries used by the walkthrough and aligned
  the marketing pages, calls to action, checkout, admin order copy and service
  agreement with the approved scope: up to eight primary pages, standard
  integrations, simple payments/automation, and explicit custom-work limits.
- Professional can now be purchased from the public checkout using the
  configured build price. Staff-created links remain available for negotiated
  or custom orders. Trusted order details are re-read on the server so hidden
  browser fields cannot change the purchased kind, template or amount.
- Professional and Custom onboarding now asks the customer to choose a kickoff
  call with the Vigil team, Virtue's guided brief, or both. The expanded brief accepts
  page and feature requirements, style direction, references, and uploaded
  layouts, sketches, moodboards, screenshots and PDFs. Express retains its
  shorter proven flow.
- Customer review, admin brief, completion email, checklist and Virtue copy all
  reflect the new route and scope. Call-only completion correctly treats the
  scheduled kickoff as the next step.
- Paid Professional and Custom orders provision the organization, dashboard,
  project, website and subscription, but do not create a generic repository.
  Staff creates the repository after reviewing the brief and choosing the
  appropriate build foundation. Express repository creation remains automatic.
- Added a data migration that updates the stored Professional build description
  without changing its configured price or Stripe identifiers.
- Verification: focused ESLint, TypeScript, the full unit-test suite, database
  migration validation, visual walkthrough checks and the Next.js production
  build pass.

---

## 2026-09-15 — Automatic customer repositories and Vercel publishing

- Paid-order provisioning now queues an idempotent `website.repository` job.
  It creates one private GitHub repository per website and seeds `site/` with
  the purchased Express template (or a safe custom-build starter), plus
  `content/`, a README, and a gitignore. Existing files are never overwritten
  on retry.
- Repository ids remain in `provider_links`; `websites.repository_ref` uses
  `github:<owner>/<repo>`. Customer site exports now read the current site and
  content directly from that private repository in production.
- Added the real Vercel deployment adapter. It creates one dedicated Vercel
  project per website, connects the private GitHub repository with `site/` as
  the root, and deploys the latest `main` branch from the admin website page.
- Deployments are asynchronous. `website.deployment.sync` polls Vercel through
  the durable job runner and updates the deployment/website only when Vercel
  reaches a terminal state.
- `vercel.json` now drains jobs every minute (without running the heavier order
  reconciliation); the existing daily run still reconciles billing. This
  schedule requires a Vercel plan that supports per-minute cron jobs.
- A successful production deployment attaches every active website domain.
  Verified DNS/SSL promotes the custom hostname to `websites.live_url`; pending
  domains retain Vercel's exact verification records for the onboarding guide.
- Production configuration: `GITHUB_TOKEN`, `GITHUB_OWNER`, optional
  `GITHUB_OWNER_TYPE`/`GITHUB_REPOSITORY_PREFIX`, `VERCEL_TOKEN`, optional
  `VERCEL_TEAM_ID`, `CRON_SECRET`, and `DEPLOYMENT_PROVIDER=vercel`. Vercel's GitHub
  integration must have access to the private repositories under that owner.
- Verification: TypeScript, focused ESLint, and 127 unit tests pass, including
  request-shape/idempotency coverage for both provider adapters.

---

## 2026-09-13 — Foundation built

### Decisions taken (see ARCHITECTURE.md §2 for the full table)

- Dashboard lives in `vigil-studios` under a second root layout `app/(vigil)`;
  the marketing site moved verbatim into `app/(site)` (URLs unchanged).
- `middleware.ts` → `proxy.ts` (Next 16 convention). The proxy only refreshes
  the session and redirects signed-out visitors; authorization is RLS plus the
  server DAL.
- Tenancy = `organizations` + `organization_members`; Vigil staff are a
  separate `staff_members` table. Active organization is a validated cookie.
- Provider identifiers live only in `provider_links`. Billing / deployment /
  domain providers are interfaces with in-memory `null` adapters and explicit
  not-configured stubs for Stripe, Vercel, Cloudflare. No SDKs added.
- Plans, prices, features and per-plan entitlements are rows. Four plan codes
  are seeded with **no prices**; every undecided limit is NULL.
- Requests, Leads, Virtue: tables + entitlement-gated routes only.
- Sign-in is a magic link. No self-serve organization creation; staff create
  the organization and invite the owner, and the invite auto-accepts on
  sign-in.
- The stale 12-day-old `next dev` process on port 3000 (PID 3246) was stopped
  so a fresh server could verify the route-group move; it served 404s for
  every new route.

### Migrations (`supabase/migrations/`)

| File | Contents |
| --- | --- |
| `20260913000000_retire_legacy_portal.sql` | Renames the June prototype's `profiles/clients/projects/project_phase_progress/onboarding_steps/project_files` to `legacy_*`, enables RLS on them, drops the prototype's `auth.users` trigger. Conditional; no-op on a fresh project |
| `20260913000001_foundation.sql` | `vigil` schema, `set_updated_at`, all enums, `protect_columns_from_customers` trigger |
| `20260913000002_identity.sql` | `profiles` (+ auth.users triggers), `staff_members`, `organizations`, `organization_members` (last-owner guard), `organization_invites`, helper functions `is_staff/is_admin/org_role/is_org_member/has_org_role/shares_org_with`, `accept_invites_for_current_user`, RLS, `public.accept_pending_invites()` |
| `20260913000003_catalog_entitlements.sql` | `plans`, `plan_prices`, `features`, `plan_features`, `subscriptions`, `entitlement_overrides`, `usage_records`, `resolve_entitlements`, RLS, seed (plan codes, feature registry, structural per-tier booleans, NULL prices), `public.resolve_entitlements()` |
| `20260913000004_websites_domains.sql` | `projects`, `websites`, `domains`, `deployments` (org inherited from website), `provider_links`, cross-tenant reference guard `enforce_same_org_references`, RLS |
| `20260913000005_operations.sql` | `audit_events` (+ `log_audit_event`, `audit_status_change` trigger on projects/websites/domains/subscriptions/deployments/organizations), `provisioning_jobs` (+ `claim_jobs` with SKIP LOCKED lease), `webhook_events`, `notifications`, RLS, public wrappers |
| `20260913000006_future_products.sql` | `change_requests` (+ customer status guard), `leads`, `virtue_settings`, RLS |

### Validation results

| Check | Command | Result |
| --- | --- | --- |
| Migrations apply cleanly | `scripts/db-validate.sh` (PostgreSQL 14 + `supabase/test/auth-shim.sql`, which now mirrors the legacy prototype tables) | ✓ all 7 files |
| RLS / integrity assertions | `supabase/test/rls.test.sql` | ✓ 75 assertions (legacy retirement, (anon, two tenants, member vs owner, staff vs admin, service role, invites, last-owner, column protection, cross-tenant references, entitlement resolution, job claiming) |
| Unit tests | `npm test` (vitest) | ✓ 47 tests: lifecycle tables cover every enum, transitions, customer wording, entitlements, redirect safety, provider registry, null providers, job runner outcomes, slug/format helpers |
| Typecheck | `npm run typecheck` | ✓ |
| Lint (new code) | `npx eslint app lib/vigil components/vigil proxy.ts` | ✓ 0 errors, 0 warnings. Pre-existing marketing-section errors (9) untouched |
| Production build | `npx next build` | ✓ 25 static + dynamic routes, proxy compiled |
| Browser | dev server, Chrome | `/`, `/express` (six industries, template iframes 200), `/process` render as before; `/dashboard/*` → `/login?next=…`; `/login` renders at 375px; `/api/health` responds |

`/dashboard` and `/admin` against real rows: see the 13 Sep evening entry
below — the project was unpaused and the migrations are applied.

### Files worth knowing

```
proxy.ts                               session refresh + optimistic redirects
lib/supabase/{env,server,browser,admin,proxy}.ts
lib/vigil/auth/{session,errors,redirects,actions}.ts
lib/vigil/{lifecycle,entitlements,audit,jobs,format,types}.ts
lib/vigil/providers/{types,null,stubs,registry}.ts
lib/vigil/services/{provider-links,deployment,domain,billing}.ts
lib/vigil/actions/{organization,domain,requests,admin}.ts
lib/vigil/queries/{dashboard,admin}.ts
app/(vigil)/{login,auth,dashboard,admin}/**
app/api/{health,jobs/run}/route.ts
components/vigil/{Shell,ShellNav,Logo,ui,ActionControls,GatedFeature,OrgSwitcher,SignOutButton}.tsx
supabase/migrations/*.sql, supabase/test/*.sql, scripts/db-validate.sh, scripts/db-gen-types.mjs
types/database.types.ts (generated)
```

---

## Security review (13 Sep 2026)

Findings and what was done:

1. **Cross-tenant references** — a member of A could insert a `domains` /
   `change_requests` row for A that pointed at B's `website_id`; RLS checked
   only `organization_id`. Fixed with `vigil.enforce_same_org_references()` on
   websites, domains, subscriptions, usage_records, provisioning_jobs,
   change_requests, leads. Covered by three new RLS assertions.
2. **Staff and customers share the `authenticated` role**, so column-level
   GRANTs cannot separate them. Replaced with
   `vigil.protect_columns_from_customers(...)` triggers on profiles (email),
   organizations (slug/status/notes), notifications, change_requests
   (assignment/allowance), leads (contact data). Tested.
3. **Audit noise** — job status hops were being audited; removed so customer
   activity stays meaningful. Jobs keep their own timestamps/errors.
4. **Job runner secret** compared with `timingSafeEqual`.
5. **Sign-out route** rejects cross-site POSTs (Origin / Sec-Fetch-Site).
6. **Job idempotency for manual re-queues** bucketed to the minute so a
   double click cannot queue two deploys.
7. **Post-login redirect** only accepts same-origin paths; tested against
   absolute, protocol-relative, backslash and header-injection forms.
8. **Provider ids, webhook payloads, job internals, staff table** are
   unreadable to customers (RLS; tested).
9. **`audit_events`** has no insert policy; rows enter only through the
   definer function, which refuses organizations the caller cannot see.

Reviewed and accepted as-is:

- `profiles` are visible to co-members of an organization (names and emails
  in the Team list). Staff see all profiles.
- A stranger can complete a magic-link sign-in and get a `profiles` row with
  no memberships; they see only the welcome screen.
- Two active subscriptions for one organization are possible by admin
  action; entitlements resolve to the highest tier. A uniqueness rule belongs
  with the billing phase.

---

## Unresolved risks and decisions

1. ~~No Supabase project.~~ The project had been **paused**, not deleted. It
   was unpaused on 13 Sep 2026 and is linked; migrations are applied.
2. **Staff bootstrap** requires one row inserted in the SQL editor (below)
   after the first sign-in.
3. **Express order → organization** bridge is not built; `projects.source_ref`
   is reserved for the leadgen order reference.
4. **Deployment topology, domain provider, pricing, allowances, offboarding**:
   configurable placeholders per master architecture §15.
5. **Next 16 `forbidden()`/`unauthorized()`** are experimental; the DAL
   redirects instead. One switch to flip later.
6. **RLS helper cost** at scale: policies call `vigil.is_org_member(org_id)`
   per row (indexed lookup). Fine for hundreds of tenants; revisit with
   `org_id in (select …)` if list queries slow down.
7. **Email template.** The default Supabase magic-link template uses the PKCE
   flow (`/auth/callback`). For links that work in any browser, switch the
   template to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.

---

## Bringing it up (owner steps)

Steps 1–3 were completed on 13 Sep 2026 (see the entry below).

1. ~~Create a Supabase project.~~ Project `fotqwyfoqzjmcchwjpof` is linked.
   `.env.local` still needs `SUPABASE_SECRET_KEY` (server only) for the job
   runner and webhooks; set `NEXT_PUBLIC_APP_URL` in production.
2. ~~Apply the migrations.~~ Done with `npx supabase db push`. Future
   migrations: add a file under `supabase/migrations/`, run
   `npm run db:validate`, then `npx supabase@latest db push`.
3. ~~Redirect URLs.~~ Applied with `npx supabase config push` from
   `supabase/config.toml` (kept minimal on purpose: it declares only the auth
   URLs, so a push can never overwrite storage or paid-tier settings).
4. Sign in once at `/login` with your own email, then in the SQL editor:
   ```sql
   insert into public.staff_members (user_id, role)
   select id, 'admin' from public.profiles where email = 'you@vigilstudios.co';
   ```
5. Open `/admin`, create the first customer, invite its owner.
6. Schedule `GET /api/jobs/run` with `Authorization: Bearer $VIGIL_JOBS_SECRET`
   (Vercel Cron or any scheduler; every 1–5 minutes on a paid plan, daily on
   Hobby). With the `null` providers the queue drains harmlessly.
7. Regenerate types after any migration:
   `npx supabase@latest gen types typescript --linked --schema public --schema vigil > types/database.types.ts` (this is now the canonical source; `scripts/db-gen-types.mjs` remains for offline work).

---

## 2026-09-13 (evening) — Project revived, schema live

- The Supabase project was paused, not deleted; the owner unpaused it.
  `.env.local`'s publishable key still works.
- The database still held the June prototype's tables with one demo
  client/project, readable by the anon key. Added migration 0000 to rename
  them to `legacy_*` behind RLS and drop the prototype's sign-up trigger.
- Owner ran `supabase login`, `link` and `db push`: all seven migrations are
  on the remote (`supabase migration list` matches). `config push` applied the
  auth URLs, then failed on the CLI template's `[storage.vector] enabled = true`
  (Pro-plan feature, HTTP 402). `config.toml` was reduced to the auth section;
  `config diff` now shows only undeclared remote-only properties and
  `config push` is a no-op.
- `types/database.types.ts` is now generated from the linked project
  (`gen types --linked`); the local generator stays for offline work.
- Verified through the anon key: `legacy_*`, `projects`, `websites`,
  `domains`, `organizations`, `plans`, `staff_members`, `provider_links` all
  return zero rows (RLS), where the prototype tables previously returned data.

## 2026-09-14 — Live walkthrough against the real project

Signed in as the first admin (staff row inserted in the SQL editor) and
drove the whole loop in Chrome against `fotqwyfoqzjmcchwjpof`:

| Step | Result |
| --- | --- |
| `/admin` overview | Counters at zero, providers `null`, service role reported missing |
| Create customer "Marlow & Fen" with owner invite | Organization + invite rows, two audit events |
| Create Express project (template `restaurant`) with website | Project `draft`, website `provisioning` |
| Add Growth subscription | `active`, price shows "Not set" (unapproved) |
| Add customer-owned domain | `pending` |
| Project `draft → intake`, via TransitionSelect | Trigger-audited |
| Queue provision + deploy, "Run due jobs now" | Both succeeded in one run: website `provisioning → building → live`, `provider_links` row `other/site`, deployment `ready`, `live_url` set |
| Queue domain connect + verify | `connect` succeeded (domain `verifying`, DNS records stored); `verify` re-queued 15 min with "DNS not yet verified" (RetryLater, attempts not burned) |
| "Open client view" → `/dashboard` | Website Live · Checking DNS (with propagation hint) · Subscription Active · project "Collecting your details" · activity · plan inclusions (Virtue included on Growth) |
| `/dashboard/domain` | Registrar instructions table rendered from `domains.verification` |
| `/dashboard/requests` (Growth ⇒ enabled) | Request submitted, listed as Submitted |
| `/dashboard/settings` | Profile saved (audited with before/after); pending invite listed |
| `/admin/requests` | `submitted → triaged`, assigned to the acting staff member |
| `/admin/plans` | Four plans, prices "not approved", entitlement matrix editable, staff list |
| `/admin/audit` | 14 events with diffs, trigger- and action-sourced |
| 390px viewport | Horizontal nav strip, stacked status cards |

Bugs found and fixed during the walkthrough (commit `e7ec98d`):

1. Pages opened at `http://127.0.0.1:3000` never hydrated — Next 16 blocks
   cross-origin dev resources and treats 127.0.0.1 as foreign. Added
   `allowedDevOrigins: ["127.0.0.1"]` (dev only).
2. `/admin/domains` crashed: `domains ↔ websites` has two foreign keys and
   PostgREST refused the ambiguous embed. Query now names the FK.
3. Uncontrolled "Website" selects kept a stale default after the website
   list changed, so a domain could be saved unattached. Forms are keyed on
   the website list and an attach-to-website control was added.
4. Magic-link redirect fell back to the production site URL because the
   allow-list is exact-match; wildcards pushed and `next` moved to a cookie.

Still open from this session:

- **Custom email template** cannot be pushed on the free tier with the
  default sender. Until custom SMTP (Resend is already a dependency) or a
  paid plan is set up, sign-in links must be opened in the browser that
  requested them and a newer link invalidates older ones.
- `SUPABASE_SECRET_KEY` is still unset locally; the console's "Run due jobs
  now" used the staff session instead (works, attributed to staff rather
  than system).
- The prototype's remote magic-link subject "Your sign-in link" remains
  (template edits are blocked); harmless.
- Test data (Marlow & Fen) lives in the real project; delete it from
  `/admin` → customer → "Mark closed" or the SQL editor before onboarding a
  real customer, or keep it as the demo tenant.

## 2026-09-14 (late) — Pro plan, custom magic-link template

- Project upgraded to Pro; `supabase/templates/magic_link.html` pushed via
  `config push`. Sign-in now targets `/auth/confirm` (token_hash, POST
  verify). **Not yet exercised end to end** — the first real click after the
  change is the first thing to verify next session, ideally from a
  different browser than the one that requested it.
- Sign-out returned 403 and auth redirects switched hosts on 127.0.0.1;
  origins now derive from request headers (`lib/vigil/auth/origin.ts`).
- Test tenant "Marlow & Fen" stays as the demo tenant by owner decision.

## 2026-09-14 — App-frame redesign

Owner feedback: the dashboard read like a website, not a platform. Rebuilt
the chrome and the two overviews; data layer, actions and routes unchanged.

- `components/vigil/AppFrame.tsx` + `AppShell.tsx`: 100dvh grid, 240px
  sidebar collapsing to a 56px icon rail (cookie `vigil-sidebar`, read on the
  server so there is no flash), off-canvas drawer under `md`, 48px top bar
  with the section title and a `TopbarActions` portal, content stretches to
  the viewport at a 13px base scale. Sidebar holds the workspace switcher,
  grouped nav with icons, and an account block (theme, sign-out, Admin ⇄
  Client). `ThemeSwitch` + a bootstrap script apply the saved theme before
  paint (same `site-theme` key as the marketing toggle).
- `components/vigil/widgets.tsx`: Panel, StatusLine, KpiTile, Meter,
  DistributionBar, Stepper, Checklist, Timeline, SitePreview. All driven by
  rows; no invented trends. Status = icon + label + colour, never colour
  alone; status tokens in `components/vigil/vigil.css` were checked with the
  dataviz validator against both surfaces (>= 3:1).
- Client Overview: template preview (real Express capture), website status,
  DNS checklist from `domains.verification`, subscription with billing-period
  meter, project lifecycle stepper with metadata, activity timeline, plan
  inclusions. Admin Overview: KPI row with a websites-live meter, attention
  list (failed jobs, broken domains, suspended sites, unpaid subscriptions,
  new requests), job-status distribution bar, platform wiring, latest
  activity. `lib/vigil/presenters.ts` holds the pure mappers (tested).
- Verified in Chrome at desktop (expanded and rail), in 390px iframes for the
  phone layout and drawer, and in the light theme.
- Owner review: logo too tight to the top (header now 56px, logo 24px) and
  the static capture stretched the site. Replaced with
  `components/vigil/SiteFrame.tsx`, the catalogue's approach: the real page
  in an iframe at a true viewport (1200px desktop / 390px phone) scaled to
  the card with a browser chrome and a desktop/phone toggle; it scrolls
  itself. `previewSource()` picks the live site when it has a real address,
  otherwise the Express template HTML; in-memory `.local` hosts never embed.

## 2026-09-14 — Website page widgets, resizable preview, request attachments

- Website page (revised after owner feedback): the preview is its own
  widget, not resizable, scaling to the viewport with a 760px cap
  (`SiteFrame` follows its container). Underneath, six standalone
  `AttributeWidget` cards — live address, SSL, last published, health, site
  code, changes — each with icon, value, hint and optional action, plus a
  "Request a change" button in the header. The earlier resizable widget was
  removed.
- Site export: `GET /api/websites/[id]/export` streams a zip (jszip) built by
  `lib/vigil/services/export.ts` — a `SiteSource` interface whose only
  implementation today is the current Express build (`site/index.html`),
  plus `manifest.json` and a README stating what is and is not included
  (master architecture §5). Owners/managers only, `export_eligible` and
  `customer_owned` required, audited as `website.exported`. Verified live:
  2.2 MB zip with the three entries.
- Migration `20260914000007_request_attachments.sql` (pushed to the linked
  project): private bucket `request-attachments` (10 MB, images + PDF),
  storage policies keyed on the `<organization_id>/…` path prefix via
  `vigil.path_organization()`, and `change_request_attachments` with a
  check that the path's organization matches the row's and a trigger that
  the request belongs to the same organization. 9 new RLS assertions (84).
- `createChangeRequest` validates files (`lib/vigil/attachments.ts`: up to 5,
  10 MB, PNG/JPEG/WebP/GIF/PDF) before creating the row, uploads under the
  user's own session, records a row per object, and removes the object if
  the row fails. `experimental.serverActions.bodySizeLimit` raised to 52 MB.
- Request lists (client and admin) show attachments with 30-minute signed
  URLs (`signAttachments`); images get thumbnails.
- Verified live: uploaded a JPEG from the form, the signed link served the
  object from Supabase Storage, and the admin table shows the same file.

## Next phase

Per master architecture §13, after locking the product catalog:

1. **Stripe adapter** — `StripeBillingProvider` implementing `BillingProvider`;
   `/api/webhooks/stripe` writing to `webhook_events` and calling
   `applySubscriptionSnapshot`; customer portal link on `/dashboard/billing`.
2. **Vercel adapter** — `VercelDeploymentProvider`; decide dedicated vs shared
   topology and record it in `websites.hosting_mode`.
3. **Domain flows** — Cloudflare adapter for Flow A; the guided Flow B already
   records the domain and DNS instructions.
4. **Express order bridge** — leadgen `orders` → organization + project +
   website, keyed on `projects.source_ref`.
5. **Requests allowances** — `usage_records` against
   `requests.monthly_allowance` once the numbers are approved.

## 2026-09-14 — Virtue-guided onboarding, Buy button, billing portal, export from repository_ref

Resumed from `HANDOFF-CONTEXT.md`. `npm run check` was green at the start
(59 tests, 94 RLS assertions) on a recreated scratch Postgres; `main` had
not moved. Commits `aea8681 … 6aa4a9a`.

### VirtueOrb (`components/vigil/VirtueOrb.tsx`, `virtue-orb.css`)

CSS-only glass sphere with a green atmosphere: layered radial/conic
gradients, blur, rim and specular highlight; `idle` breathes, `working`
swirls faster, `done` settles. Sizes `sm` (24px, inline; also the Virtue nav
icon), `md` (56px, step headers), `lg` (120px, welcome / success). Colour
comes from `--accent`, glass tint per theme, motion off under
`prefers-reduced-motion`. Reused later as the face of the real Virtue.

### Onboarding (`/dashboard/onboarding`)

- **Brief** (`lib/vigil/onboarding/brief.ts`): one JSON document in
  `projects.brief` with `basics`, `offerings`, `about`, `brand`, `domain`,
  `progress` and a reserved `scope` (staff-written agreed scope). Every step
  validates only its own section; `parseBrief` never throws.
- **Wizard** (`app/(vigil)/dashboard/onboarding/*`): welcome → business
  basics (hours day-by-day / same every day / by appointment) → what you
  offer (services / menu / products, repeatable rows, optional sections) →
  about → brand and photos → domain → review and send. Progress bar,
  Virtue's line at the top of each step (`virtue-copy.ts`), autosave 700 ms
  after each change (`useAutosave`, also flushes on unmount), "Saved"
  indicator, `?step=` resume, back / "Do this later" on every screen.
  Mobile-first: min-44px targets, single column at 375px.
- **Uploads**: browser-direct to the `project-assets` bucket at
  `<org>/<project>/<uuid>.<ext>`, rows in `project_assets` (kinds logo /
  photo / document, captions). Migration **0009** (pushed) lets members
  update caption/kind only; RLS test added.
- **Domain step**: *Yes, I own one* → hostname → registrar guessed from the
  apex's public nameservers (`services/dns.ts` → `domain-guides.ts`
  suffix table), confirmable in a select → `domains` row (customer_owned,
  pending, attached to the project's website) → numbered walkthrough per
  registrar (`lib/vigil/domain-guides.ts`: sign-in URL, DNS menu path,
  field names, before-notes, the records with copy buttons, conflicts,
  propagation note, help link) → "I've added the records" → `verifying`,
  `domain.verify` job (50 attempts) plus an inline check, page polls every
  20 s; "Prefer we do it?" records `delegate` for the staff email. *No, I
  need one* → up to three preferred names, registrant-ownership promise.
  *Not sure* → one paragraph, then the same two paths. The same
  `components/vigil/DomainGuide.tsx` renders on `/dashboard/domain`, so
  "later" is never a dead end. Records come from
  `domains.verification.required_records` when a provider supplied them,
  else the platform targets `VIGIL_DNS_APEX_A` / `VIGIL_DNS_CNAME_TARGET`
  (`requiredRecords`); `beginDomainVerification` stores those when no
  provider site exists yet and `verifyDomain` checks public DNS directly in
  that case (job re-checks every 6 h until a site exists).
- **Send**: `intake_completed_at`, audit `project.intake_completed`, staff
  email with the domain answer and file count, project `intake →
  in_progress` when the service role is available. Afterwards the wizard
  shows Virtue's "what happens next" (response window from
  `NEXT_PUBLIC_ONBOARDING_RESPONSE_WINDOW`) and a read-only "What you sent".
- **Entry points**: first sign-in → Overview redirects into the wizard while
  the newest intake/draft project has no `intake_completed_at`, unless the
  `vigil-onboarding-later` cookie (set by `/dashboard/onboarding/later`, 7
  days) is present; the Overview then shows the `OnboardingCard` (progress
  checklist, Continue) and, after sending, the "I've handed your details to
  the team" card. Sidebar gets a "Getting set up" item (orb icon) while
  onboarding is due. `/checkout/success` speaks as Virtue with the orb.
- **Admin**: the customer page shows the brief read-only
  (`components/vigil/BriefSummary.tsx`) with 30-minute signed links to the
  uploads, and the organization's orders.

### Buy button, billing portal, export

- `components/express/ExpressCatalogue.tsx` (Codex-owned; the single agreed
  edit): "Enquire" → `Buy · $<EXPRESS_PRICE>` linking to
  `/checkout?template=<slug>`.
- `/dashboard/billing` "Manage billing" (owner/manager, shown only when the
  organization has a linked provider customer): `openBillingPortal` →
  `createPortalSession` → redirect; audited.
- `lib/vigil/services/export.ts`: `repositorySource` reads
  `websites.repository_ref` under `VIGIL_CLIENTS_ROOT` (locally `..`, i.e.
  `Websites/clients/<org-slug>/`): `site/**` (required), `content/**`,
  project README. Falls back to the template capture. Paths under the root
  are joined without `path.join(x, "literal")` because Turbopack's file
  tracer otherwise pulled the whole workspace into the route's output.

### Checks

| Check | Result |
| --- | --- |
| `npm run check` | 84 unit tests, 98 RLS assertions, typecheck clean |
| `npx eslint app/(vigil) lib/vigil components/vigil app/api proxy.ts` | clean |
| `npx next build` | clean, no tracer warning |
| Browser (Chrome, signed in as admin viewing Marlow & Fen) | Whole wizard at desktop: autosave, offerings rows, a real PNG upload to Storage (thumbnail after reload), registrar detected as Cloudflare for `vigilstudios.co`, full guide with copy buttons, review, send → staff email dry-run, Overview card, admin brief with file link. 375px via iframes: welcome, basics, offerings, brand, domain question, domain guide, review, sent state, billing. Light theme checked. |

Test data left in the demo tenant on purpose: Marlow & Fen's brief is sent
(status still `intake` locally because no service key), a `vigilstudios.co`
domain row (pending, no records stored), one photo asset, a cancelled
project "Mobile onboarding check" with its website archived.

New tests: `orders.test.ts` (startCheckout, completeCheckout,
provisionOrder idempotency with an extended `FakeAdmin`), `stripe.test.ts`
(`parseWebhook` with `generateTestHeaderString`), `onboarding.test.ts`,
`dns.test.ts`, repository export.

### Not done in this session

- Stripe test-mode end-to-end: needs `SUPABASE_SECRET_KEY`,
  `BILLING_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  (`stripe listen --forward-to 127.0.0.1:3000/api/webhooks/stripe`) and
  approved prices + "Sync prices" on `/admin/plans`. Then: catalogue Buy →
  `/checkout` → Stripe → `/checkout/success` → welcome email → `/auth/confirm`
  → wizard. Merge to `main` after that run.
- Friends-and-family discounts and the custom-scope UI (backlog in the
  handoff) — `brief.scope` is reserved for the latter.

## 2026-09-14 (later) — Billing periods and the approved price table

Owner approved (14 Sep): Basic $29 / $290 / $779, Care $99 / $990 / $2,670,
Growth $199 / $1,990 / $5,370, Priority $399 / $3,990 / $10,770 (monthly /
annual / three years), sales tax charged to the customer at checkout.

- Migration **0010** (pushed): `plan_prices.interval_count` (3 years = year
  × 3, the provider's own model), unique key widened, `orders.plan_price_id`,
  and the approved amounts inserted as rows (still editable on
  `/admin/plans`, which now has three price inputs per plan).
- `lib/vigil/billing-periods.ts`: the period registry (key ↔ interval ×
  count, labels, months), lookup keys (`plan:care:usd:year3`), savings maths,
  `describePrice`. Adding a period = one row plus one entry.
- Checkout: billing-period toggle (Monthly / Annual / 3 years with the best
  "save X%" badge), per-plan price for the chosen period with the monthly
  equivalent, order summary and renewal sentence follow it; `startCheckout`
  picks the (interval, count) row, snapshots `plan_price_id`, and
  provisioning attributes the Stripe price to that row. `/checkout?plan=&period=`
  preselects.
- Stripe: `ensurePrice` creates/reuses prices with `interval_count`;
  Checkout Sessions enable Stripe Tax with a required billing address and
  `customer_update.address` (`STRIPE_TAX=true` is now the example default).
- Types regenerated from the linked project. 89 tests, 98 RLS assertions,
  build clean. Browser: `/admin/plans` shows the three columns from rows,
  all "not synced" until Stripe credentials exist.

## 2026-09-14 (evening) — Stripe test-mode run, end to end

With `.env.local` complete (service key, `BILLING_PROVIDER=stripe`, test
secret key, `stripe listen` webhook secret, Resend, `STRIPE_TAX=true`):

| Step | Result |
| --- | --- |
| `/admin/plans` → Sync prices to stripe | 12 plan prices (4 plans × month / year / 3 years, with `interval_count`) and 2 build prices created in Stripe; ids shown from `provider_links` |
| `/checkout?template=restaurant&plan=care&period=year3` | Period toggle with save badges, Care selected, order summary $599 + $2,670 |
| Stripe Checkout (test card 4242) | Correct line items ("Billed every 3 years"), Stripe Tax calculated from the billing address ($0 — no Texas registration yet) |
| `/checkout/success` | Virtue orb, "Account ready" within the page's own refresh |
| Webhooks (14 events) | Every event in `webhook_events` once; `checkout.session.completed`, `customer.subscription.created`, `invoice.paid` processed, the rest ignored |
| Provisioning | Organization `ember-oak-cigar-lounge`, owner invite, project (intake), website (provisioning), subscription **Vigil Care · $2,670 / 3 years** attributed from Stripe, Stripe customer linked, audit rows; an auth user was created by `generateLink` (the welcome sign-in link path works against the real Auth API) |
| Emails | Sent through Resend (no dry-run log): welcome to the test address, staff notification to `STAFF_NOTIFY_EMAIL` |
| Staff link | "Send a checkout link" (custom $3,500 + Growth) → `/checkout/<token>` prefilled and locked to the order |

Bugs found and fixed:

1. Stripe refused `customer_update` on a session opened with `customer_email`
   (only valid with an existing `customer`); now sent only in that case.
2. A server-side checkout error wiped the typed form; inputs are controlled.
3. Order amounts said "/mo" for every period; they now describe the period.
4. A self-serve order whose payment page could not be opened stayed
   `pending`; it is now `failed` with the provider's message (staff links
   stay pending for a retry). Test added.

Test rows in the live project: organization "Ember & Oak Cigar Lounge"
(provisioned; delete from `/admin` or the SQL editor when no longer
useful), one expired self-serve order, one expired staff link
("Humidor House (test link)"), Stripe test-mode customer/subscription.

Still to do before live: production env vars on Vercel (same names, live
Stripe key, the dashboard webhook endpoint's secret), Stripe Tax
registrations, `NEXT_PUBLIC_TERMS_URL` / `NEXT_PUBLIC_REFUND_NOTE`, and a
Vercel Cron for `/api/jobs/run`.

## 2026-09-14 (night) — Live/test mode on price links

Found while checking the first live sync: Stripe test and live ids share one
`provider_links` table. A live sync would have added a second price link
per row (unique key is on the external id), making the lookup ambiguous —
and a later test-mode sync from a laptop would have repointed production.

- `BillingProvider.mode` ("live" | "test", from the key prefix). Price links
  record it in `metadata.mode`; one link per mode is kept and the lookup
  picks the one matching the running key, so local test checkouts and the
  live site read the same database safely. A price change re-sync replaces
  only that mode's link.
- Admin overview and Plans show "stripe (test mode)" / "(live mode)", and a
  price id from the other mode is flagged "re-sync". Test added.

## 2026-09-15 — Password sign-in; price links after the live sync

- Owner feedback: an email link on every sign-in is too much. Sessions
  already persist 400 days per browser (`@supabase/ssr` default), so the pain
  is new devices and sign-outs. Added **password sign-in** alongside the
  link (D14 allowed this without schema changes): `/login` asks for email +
  password with "No password yet, or forgot it? Email me a sign-in link"
  underneath; `setPassword` (Settings → "Your sign-in", Plans & staff for
  staff) calls `auth.updateUser({ password, data: { has_password: true } })`;
  the client Overview and the admin Overview show a set-a-password card
  until it is set. Forgot password = email link, then set a new one.
  Verified live: wrong password message, password sign-in for the
  provisioned test buyer straight into the Virtue wizard, set-password from
  the Overview, sign-out.
- First live sync done by the owner on www.vigilstudios.co: 14 live prices.
  Production `/checkout` is on. The laptop's older test links carried no
  mode stamp and stopped matching; stamped them `test` and removed 14 dead
  ids from an earlier provider run; `recordPriceLink` now also sweeps
  unstamped links on sync.

## 2026-09-15 — Welcome email failure is visible and survivable

Owner's first self-run walkthrough: payment and provisioning worked, no
welcome email. Resend refused the send ("vigilstudios.co domain is not
verified") and `sendEmail` returned `{ sent: false }` without a trace.
Now: every failed send is logged with recipient and subject; `provisionOrder`
records `metadata.welcome_email = { sent, error, at }` on the order; the
success page reads it and, when the email did not go out, says so and makes
"Sign in with a link" (→ `/login?email=…&next=/dashboard/onboarding`, which
Supabase mails itself) the primary button — offered as a secondary link
even when the email was sent. "Resend" reports a failure instead of
claiming success. Owner action: verify the domain in Resend.

## 2026-09-15 — Virtue redesign: shader orb, speech, journey

Owner direction: the onboarding must feel alive with Virtue; no single box
of steps; Virtue centred and speaking; the dashboard dimmed behind her on
first arrival; steps fixed on the left of the forms.

- **Orb** — `components/ui/orb.tsx` is the owner-supplied react-three-fiber
  shader orb, adapted: noise texture at `/public/virtue/perlin.png` (no
  third-party CDN), four-stop colour ramp with Vigil's greens
  (`VIRTUE_COLORS`, `VIRTUE_RAMP_ENDS`) so the orb is green in both themes,
  theme inversion off, `still` mode (one frame) for reduced motion, geometry
  filling its circle. `VirtueOrb` keeps its API (sizes xs/sm/md/lg/xl;
  states idle / thinking / listening / talking, with `working` and `done`
  kept as aliases) and renders a `<div>` — never inside a `<p>`. The CSS orb
  is gone. three / fiber / drei were already dependencies.
- **Speech** — `components/vigil/VirtueSpeech.tsx` streams words one after
  another and reports start/stop; `useSpeaking` maps that onto the orb's
  `talking` state. Instant under prefers-reduced-motion.
- **After checkout** — `/checkout/success` is a centred stage: xl orb, the
  spoken greeting and one instruction (open the email / sign in with a
  link), actions fade in after the words. `CheckoutShell` gained `centered`.
- **First dashboard arrival** — `VirtueWelcome`: dimmed, blurred dashboard
  behind a centred speaking Virtue with "Let's begin" (→ basics) and "Look
  around the dashboard first" (session cookie; `?clear=1` on the later route
  brings her back). Shown while the brief's last step is `welcome`; the old
  redirect is gone. Copy in `welcomeSpeech`.
- **Getting set up** — no card. Desktop: a sticky left rail (Virtue speaking
  the step intro, numbered vertical steps with completion ticks, step count,
  save state, Virtue note) beside the form. Phones: Virtue on top, the step
  strip sticks to the top while the form scrolls. The welcome step is
  retired (`WelcomeStep.tsx` removed); the sent state is Virtue centred.
- Verified in the in-app browser (Chrome throttles animation and timers in
  a hidden window, which made the orb look black there): success page,
  welcome overlay, wizard at desktop and 375px, sticky strip, orb states.

## 2026-09-15 — Go-live fixes after the owner's test runs

- **Plans greyed out after a purchase** — `provisionOrder` re-linked the
  Stripe price it saw on the subscription and the upsert wiped the link's
  `metadata.mode` stamp, so the plan stopped matching the test key.
  `upsertProviderLink` now writes metadata only when given; provisioning
  passes the provider mode; the three wiped links were re-stamped. Test.
- **Welcome email** — still Resend "domain not verified"; nothing to do in
  code (Virtue already offers the sign-in link).
- **Password first** — the welcome overlay opens with Virtue asking for a
  password (compact form) when the account has none, then "Thank you.
  Welcome to Vigil." and Let's begin. The Overview card only shows on
  later visits.
- Wizard centred (`max-w-5xl`) on wide screens; journey pages show the
  logo alone.
- **Vigil Express** — the tier, nav item, page title, catalogue heading,
  admin copy and the build price row (migration 0011) now say "Vigil
  Express". Catalogue order: Restaurant and cafe, Retail and boutique, Salon
  and spa, Auto shop, then Home services and Medical and dental marked
  `status: "coming"` — an "Under construction" panel in the preview (theme
  tokens, so it flips with light/dark), View and Buy locked, and
  `/checkout` ignores those slugs. `lib/constants.ts` and
  `components/express/*` edited at the owner's explicit request.
- **Test data removed** from the live project: four purchase-test
  organizations (with cascades), six orders, their storage files, provider
  links and auth users. Migration 0012 lets an organization delete cascade
  past the last-owner guard (RLS test). Marlow & Fen stays as the demo.

## 2026-09-15 — Success-page provisioning stuck on "give me a moment"

The owner's test purchase (test mode, on the local dev server, so no
webhook could arrive) sat on the success page forever. The order was
`paid`, but the provision job had failed once with "Order … is pending,
not paid" and a validation failure is never retried.

- **Cause: Next.js request memoization.** Inside one server-component
  render, identical GET `fetch`es are deduped. The success page's fallback
  calls `completeCheckout` (read order, update to paid) and then
  `provisionOrder` (read order again with the identical query) — the second
  read returned the memoized, pre-update row. Route Handlers are not
  memoized, which is why the webhook path had always worked. The fallback
  matters in production too: the success redirect often beats the webhook.
- **Fix.** The service-role client (`lib/supabase/admin.ts`) now passes a
  fresh `AbortController` signal and `cache: "no-store"` to every fetch,
  which opts out of memoization and the Data Cache. `enqueueJob` takes
  `requeueFailed`; the webhook and the success page use it for
  `order.provision`, so a failed job no longer blocks a later trigger. The
  success page (re)queues and runs provisioning for any `paid` order it
  sees, not only one it just completed. Job failures are logged and a
  thrown plain object is described by its `message` (was "[object
  Object]"). Tests for the requeue and the message.
- Recovery: reloading the stuck success page provisioned the order and sent
  the welcome email. One stray failure record ("[object Object]", attempt
  2) appeared on the job ~30 s after the successful run with no second
  provisioning; source not identified from the dev logs — the new logging
  is there for the next occurrence.
- Sales-tax copy removed from the marketing site at the owner's request
  (FAQ, pricing page lead, home pricing footnote).

## 2026-09-15 — Cron, terms, refund note (before the first real purchase)

- `vercel.json` cron: `/api/jobs/run?limit=50` daily at 09:00 UTC (the team
  is on Hobby, where daily is the ceiling). `CRON_SECRET` set as a sensitive
  production var; the route accepts it or `VIGIL_JOBS_SECRET`.
- `/terms` — the service agreement in the product's voice, written by
  Claude from the master doc's ownership/offboarding rules and the site's
  existing promises, plus the owner's refund rule (build fee refundable
  until work starts, none after; plan periods already started are not
  refunded). Flagged for a lawyer's review before relying on it. Linked
  from the footer and the sitemap.
- Production env: `NEXT_PUBLIC_TERMS_URL=https://www.vigilstudios.co/terms`,
  `NEXT_PUBLIC_REFUND_NOTE` = the one-sentence refund rule shown under the
  checkout checkbox. Both baked in at build time.

## 2026-09-15 — Guardrails around the transactional path

Owner's ask after the stuck-success-page bug: tests, checks and
reconciliation wherever the purchase → account → onboarding path could
fail silently.

- **`settleOrder`** (`lib/vigil/services/settle.ts`): one idempotent
  function that takes an order from wherever it is (pending → ask the
  provider; paid → (re)queue provisioning and run it) and reports the
  state. The success page is now three lines around it; reconciliation
  uses it too.
- **`receiveBillingEvent` / `handleBillingEvent`**
  (`lib/vigil/services/webhook.ts`): the inbox and the handling moved out
  of the route so they can be tested. Invoice events now report
  "unattributed" like subscription events do.
- **Reconciliation** (`lib/vigil/services/reconcile.ts`), run by
  `/api/jobs/run` after draining the queue (`?reconcile=0` skips): paid and
  unprovisioned for 10 min → provision again, and if still stuck email
  staff (once per day per order, remembered in `orders.metadata.reconcile`);
  pending with a session for over an hour → ask the provider once: paid
  completes and provisions, expired marks the order `expired`; provisioned
  with a failed welcome email → one more send, then staff; brief sent
  without a `project.intake_notified` audit row (submitIntake writes one on
  a successful send) → the staff notification again, floored at the day
  the record started existing so old briefs are not re-sent.
- **Alerts**: any job that fails for good (non-retryable or exhausted)
  emails staff with what it means ("a paid order could not be
  provisioned…") and where to retry it.
- **Null provider** gave a checkout and its subscription different customer
  ids, so the "subscription from the provider's snapshot" path had never run
  in tests; fixed, and the orders test now asserts the linked subscription.
- **Tests** 93 → 123: checkout form schema; settleOrder (pending→provisioned,
  failed job re-queued, no-op, unpaid, queue-only); webhook (records +
  provisions, duplicate acknowledged, session-link lookup, re-queues a
  failed job, unpaid ignored, subscription update / unattributed, handler
  failure → inbox failed + rethrow); reconciliation (each branch, the daily
  alert window, welcome retry then alert, intake re-notification and its
  floor); billing snapshots (create + link, update, refuse to guess);
  completeCheckout edges; provisioning resumes half-done work; job failure
  alerts (and none for a scheduled retry).
- **CI** (`.github/workflows/ci.yml`): typecheck, lint, tests and a
  no-secrets `next build` on every push and PR. The three pre-existing
  setState-in-effect lint errors are fixed: theme now comes from a
  `data-theme` store (`components/ui/useSiteTheme.ts`) in ThemeToggle and
  Navigation; CalendlyModal uses `useHydrated()`.
- Not covered, still: a live Stripe run (manual, the owner's next step),
  refunds/cancellations beyond the subscription snapshot, and Resend
  actually delivering (the domain check is on the Resend side).

## 2026-09-15 — First live purchase (fifty cents), email fix, cleanup

- Owner ran a live purchase on www.vigilstudios.co with the single-use
  `FIFTYCENTS` code (coupon `LIVE_TEST_50C`, 99.92% off the first
  invoice): $0.50 charged, `checkout.session.completed` arrived through the
  live webhook and provisioned the account, subscription linked from
  Stripe's snapshot. Transactions are ready.
- Welcome email failed on that run: production had `EMAIL_FROM`,
  `EMAIL_REPLY_TO` and `STAFF_NOTIFY_EMAIL` set to empty strings, which
  `??` kept, so Resend rejected the sender. `||` now treats empty as unset
  and the production values are set. Reconciliation's welcome retry then
  sent it (`welcomeResent`), the first proof of production email.
- Cleanup: Stripe subscriptions cancelled (live `sub_1UG3d6…`, test
  `sub_1UG0jO…`); organizations Penny Check and Check 1 deleted with
  cascades, their orders, provider links, jobs and the two auth users
  (`belierjavier@vigilstudios.email`, `hello@vigilstudios.co`, neither
  staff). Marlow & Fen and the admin account remain. The $0.50 live charge
  (`ch_3UG3d3Bq4c89LxhO1YvXWZaU`) is the owner's to refund in Stripe.
- Not built (owner asked, then the live test took priority): cross-device
  sign-in handoff after the welcome email — the tab that paid signing in
  when the link is opened on another device. Design agreed: handoff row +
  cookie from the checkout browser, row id on the welcome link, one-time
  grant claimed by the polling tab; the login-page link cannot use it
  until login emails move off Supabase's template.

## 2026-09-15 — Safe custom-domain cutover

- Onboarding can collect an existing domain immediately, but it no longer
  invites a customer to change DNS before the replacement site has a real
  Vercel project. Planned records remain internal; the customer sees a clear
  no-action-yet state so their current website and email stay untouched.
- A ready production deployment attaches both the apex and `www`, makes
  `www` canonical, and applies a permanent 308 redirect from the apex in
  line with Vercel's recommendation. Explicit subdomains remain unchanged.
- Deployment completion now always enqueues a deployment-specific domain
  verification job. Verification covers every managed hostname, asks Vercel
  to re-check pending ownership challenges, waits for DNS plus SSL, and only
  then promotes the custom canonical URL to `websites.live_url`.
- Registrar and assisted-cutover requests are persisted on the domain row.
  Staff sees an "Assisted cutover requested" flag in both domain admin views;
  customer guidance says never to send passwords or transfer codes and to
  preserve MX, TXT, CAA, and email records.
- Domain classification and registrar lookup now use the public suffix list,
  so country-code domains such as `example.co.uk` are treated as apex domains
  instead of being mistaken for subdomains.
- Added provider and service coverage for redirect configuration, pending
  Vercel ownership verification, pre-deployment cutover gating, dual-host
  attachment, and canonical URL promotion. Full check: 135 tests, typecheck,
  and database/RLS validation pass.
- Launch audit found the deployed Next.js 16.2.9 inside the range of a newly
  published critical middleware/proxy advisory. Upgraded Next.js and its
  ESLint config to 16.3.5; the production dependency audit is now clean.

## 2026-09-16 — Professional design review and launch gate

- Every Professional project now receives exactly two included build-review
  rounds: Design direction, then Full-site review. The database enforces the
  order, immutable version history, one response per current version, and an
  explicit customer approval or consolidated change list.
- Customers review responsive preview URLs inside `/dashboard/review`, attach
  images or PDFs to consolidated feedback, compare version history, and keep
  access regardless of their post-launch Requests entitlement.
- Staff gets `/admin/reviews` plus a project workspace for publishing preview
  versions, reading feedback and signed attachments, and starting revision
  work. A revised version stays within the same included round.
- Review attachments live in a private, organization-scoped Storage bucket.
  Review publication and customer responses create in-app notifications and
  audit records.
- Professional production deploys are blocked at the deployment service and
  asynchronous sync boundaries until both current versions are explicitly
  approved. Preview deploys remain available throughout review; Express and
  Custom deploy behavior is unchanged.
- Added unit coverage for the review contract, attachment rules, and deploy
  gate, plus end-to-end migration/RLS assertions. Full check: 152 tests,
  typecheck, database/RLS validation, lint (one pre-existing image warning),
  and production build pass.

## 2026-09-16 — Overflow-safe file upload controls

- Replaced every customer-facing native file picker with one bounded `FileUploadButton`. The native control is now absolutely positioned inside a `relative`, `overflow-hidden` upload boundary, preventing browser focus from extending the dashboard's vertical scroll area.
- The shared control covers onboarding logos, photos, menus and inspiration, Professional review references, and request attachments.
- Added a source-level regression test that fails when a raw file input is introduced anywhere under `app` or `components`; future upload areas must use the shared bounded control.

## 2026-09-16 — Canonical admin template selection

- Replaced the free-text template slug fields on customer project creation and website editing with dropdowns sourced from the finished entries in `EXPRESS_TEMPLATES`. Each option shows its slug and industry; catalogue entries marked coming soon are not assignable.
- Admin project, website, and checkout-link actions now reject template slugs outside the available inventory. A regression test prevents free-text template slug inputs from returning to admin pages.

## 2026-09-17 — Automatic customer project progress

- Project progress now follows authoritative delivery events: admin-created work begins at intake, completed onboarding starts the build, a ready preview starts review, Professional revision work returns to build, final approval marks the project approved, and a live website marks it launched with a launch timestamp.
- Database triggers make the synchronization apply to every code path, deployment services advance through valid intermediate states, and the customer dashboard derives a truthful minimum stage from completed milestones as a final safeguard.
- Migration `0019` backfills existing rows, including websites that were already live while their linked project remained in draft or intake. Manual admin transitions remain available for exceptional workflows.

## 2026-09-20 — Automated Creative Workspace after Create Repo

- **Create repository** keeps its behaviour and, once the repository exists,
  queues a separate durable job `website.creative_workspace` for Professional
  and Custom projects (policy `CREATIVE_WORKSPACE_PROJECT_KINDS`). A model or
  storage failure there can never roll back or corrupt the repository.
- The job writes `.vigil/creative/` into the customer repository in one
  commit: immutable `source/` snapshots of the onboarding brief (internal and
  private fields redacted, listed in `workspace.json`), Terra's validated
  intelligence under `intelligence/`, `client-assets/` with an
  `assets-manifest.json` (small files copied, videos and files over the
  configurable limit left in storage as manifest entries plus
  `.reference.json`), empty `outputs/phase-1` and `phase-2`, a versioned
  `README.md` and `ASTRA_INSTRUCTIONS.md` (source precedence, tool awareness,
  Phase 1 → human gate → Phase 2, Vigil's creative standard).
- Terra is `gpt-5.6-terra` via the OpenAI Responses API with strict
  structured output, the first and only OpenAI integration in the repo
  (`lib/vigil/creative/terra.ts`). Output is validated against a zod schema
  before use and stored on the row, so a retry after a Git failure reuses it.
- Migration `0025` adds staff-only `creative_workspaces` (status, versions,
  checksums, cached intelligence, generated-file shas, warnings, error,
  commit). Admin website page gains a Creative workspace card with
  Generate/Regenerate. Regeneration commits only what changed, never touches
  `outputs/`, and keeps hand-edited generated files beside a `.v2` copy.
- `GitHubRepositoryProvider` gains `getBranchHead`, `listTree` and
  `commitFiles` (Git Data API, non-forced ref update). Deploy preview / live
  and the deployment service are unchanged; a test asserts the separation.
- Checks: 265 unit tests (40 new), typecheck, lint, database/RLS validation
  (new assertions for 0025) and production build pass. Operator notes in
  `CREATIVE_WORKSPACE.md`. Needs `OPENAI_API_KEY` on Vercel and `db push`.
- Follow-ups the same day: uploads now stream a SHA-256 in the browser
  (`lib/vigil/checksum.ts`, migration `0026` adds `project_assets.checksum`)
  so every manifest entry carries a hash and committed files are verified
  against it; PDF text layers are read with `pdf-parse` for Terra and saved
  under `source/documents/`; `next.config.ts` keeps pdf-parse external.
  First live run against OpenAI reached the API and stopped on "no credits
  remaining" — the failure shows on the card and the job retries by itself.


### 2026-10-05 — Creator campaign and automatic build promotion

Added `/creators` using public site primitives, canonical tiers/pricing, existing Express and Professional flows and Vercel Analytics with bounded session attribution through checkout/provisioned success. The latest creator direction uses a centered, viewport-sized HTML/CSS laptop with random social reactions, accessible pause/reduced-motion handling, a scroll cue and three compact sections. A shared public banner promotes the requested 15% offer. The server derives new self-service Express/Professional build amounts from canonical catalog rows, charges an existing ad-hoc one-time line beside the unchanged recurring plan, records the offer in order metadata and disables stacked promotion codes. Existing staff/custom quotes and token retries retain their trusted amounts; approved price-sync guards remain. Offer configuration and cache keys share enable state/percentage. No dependency, schema, client workspace or unrelated Design Engine change.

Validation: full lint, standalone typecheck, 70 test files / 1,252 tests, optimized production build and 128 production-preview browser checks pass across small iPhone through desktop with no reported hydration/runtime errors. Offer tests cover exclusions, rounding, disable state, currencies/sync, quotes/retries and the Stripe request contract. Initial campaign migration/RLS validation passed on a temporary local cluster; no new schema. Local production-profile Stripe is unconfigured, so its assisted Express/Professional fallbacks were verified. Hosted Stripe/webhook/catalog readiness, final Scar link and live custom-event ingestion must be checked before promotion. No payment, booking, deployment, commit or push. Full configuration/routes/file list: `docs/campaigns/CREATORS.md`; screenshots/results: `docs/campaigns/evidence/`.

### 2026-10-05 — Creator collage, looping banner and real project startup

Replaced the laptop hero with the user-supplied seven-photo React layout while preserving centered campaign copy and Bodoni Moda. Generated and visually inspected faceless candid digital-camera photos for creator life, cars, beauty, fitness, food, fashion and music; optimized local responsive 300/450/600px WebPs and documented exact prompts. Retained bounded random social reactions and added offscreen-paused collage floats, restrained section/card/footer entrances and hover motion. Purchase CTAs use the shared site button styling; prices use pink Space Grotesk. The public promotion banner now loops continuously, names creators/influencers and uses Vigil’s Space Grotesk with accessible pause/static reduced-motion handling. Scar’s full-viewport spotlight plays a deferred 341KB recording of the actual client startup on entry, with pause/resume/replay, manual-pause persistence, offscreen suspension and a real still fallback. No client workspace, pricing logic, dependency, schema or unrelated Design Engine changes in this visual revision.

Validation: full lint, standalone typecheck, optimized production build, all 1,252 tests across 70 files and 192 production-preview browser checks pass. Six viewports include 320×568 phones and 1366×768 laptops; responsive photos, shared CTA styling, motion controls, reduced motion, startup playback, attribution, metadata and existing Express/Professional assisted fallbacks were checked with zero reported hydration/runtime errors. Screenshots and browser results are in `docs/campaigns/evidence/`; current release notes/configuration are in `docs/campaigns/CREATORS.md`. No payment, booking, deployment, commit or push.

### 2026-10-05 — Slower creator entrances and sharper Scar playback

Extended hero copy/photo/section entrance animations to 1.5–1.8 seconds, with stronger fades, more travel and staggered photo arrivals; slowed the social-reaction lifecycle to 4.4 seconds. Removed the visible hero pause/resume control at the user’s request while retaining automatic offscreen/hidden-tab suspension and reduced-motion behavior. Replaced the previous twice-compressed 960px preview with a fresh native 1920×1196 recording of the actual client site: lossless PNG frame capture followed by a single high-quality CRF 16 H.264 encode, 30fps, 10.03 seconds, 2.35MB, silent and deferred until visible. The matching 1920px WebP quality-90 poster is approximately 195KB. No client source, dependencies, pricing, routing, analytics or schema changes.

Validation: full lint, standalone typecheck, optimized build, 1,252 tests / 70 files and 206 production-preview browser checks pass, including native resolution, Retina pixel coverage, slower entrances, removed hero control, automatic offscreen suspension and existing funnel behavior. Refreshed the user’s in-app preview and verified actual 1920×1196 playback without a media error. Updated screenshots/results: `docs/campaigns/evidence/`; current configuration/provenance: `docs/campaigns/CREATORS.md`. No deployment, payment, booking, commit or push.

### 2026-10-05 — Banner hero destination and continuous interaction motion

Changed the shared promotion link to `/creators#creator-hero` with a stable hero section ID, so both cross-page visits and clicks from farther down the creator page return to the hero. Removed automatic marquee pauses on hover/focus; the explicit pause/resume control and reduced-motion static message remain. Campaign activation, click events and downstream attribution are preserved.

Validation: full lint, standalone typecheck, optimized production build and 209 production-preview browser checks pass with no reported hydration/runtime errors. New checks cover same-page/cross-page hero landing and actual animation-time advancement after clicking with hover/focus retained. Refreshed the mobile in-app preview and verified the hero destination plus running animation. Evidence: `docs/campaigns/evidence/creators-banner-hero.png` and `browser-results.json`. No deployment, payment, booking, commit or push.

### 2026-10-06 — Creator campaign production release preflight

User authorized the campaign production commit and deployment. Staged only campaign source, pricing/checkout integration, assets, documentation and creator log entries; excluded unrelated admin/Design Engine work. Exported the exact index into a clean temporary directory without local provider environment files. Full lint, standalone typecheck, all 290 tests / 48 files and optimized production build pass. Existing `main` → Vercel Git integration handles the production release.

### 2026-10-06 — Repository-wide package positioning refresh

Canonical scope and marketing now distinguish curated single-page Express, premium multi-page Professional composition and bespoke Custom (Growth-level) work. Updated pricing/cards/comparison/FAQs, Professional fit routing, creator/Scar context, pre-payment scope, onboarding/portal labels, terms, metadata and animated homepage copy. Recurring labels follow enabled database features and distinguish unfinished Virtue/Lead Hub/Insights from live guided onboarding; unset allowances are not promised. Preserved catalog names/prices/entitlements and the existing creator promotion. Added a guarded description-only catalog migration, validated locally without hosted push. Existing unrelated admin/engine work and Scar source remain untouched.

Verification: 1,286 tests / 72 files, full lint, typecheck, production build and migration/RLS validation pass. Four-size browser matrix: 56 route/viewports plus billing, FAQ, fit-routing, comparison and authenticated dashboard checks; no runtime/hydration errors. Fixed 320px savings-toggle overflow without reducing typography. Current naming conflict, Stripe/local checkout limits, sources and release notes: `docs/business/PACKAGES.md` and `PACKAGE_REFRESH.md`; evidence beside them. No deployment, payment, provider sync, commit, push or next Design Engine milestone.

### 2026-10-06 — Package refresh production release preflight

User authorized production release. The exact release tree excludes unrelated admin/Design Engine work and passes full lint, standalone typecheck, 292 tests / 49 files, optimized build and migration/RLS validation without local provider environment files. Existing main → Vercel Git integration deploys the website. Hosted description-only migration is pending Supabase Keychain approval; canonical application descriptions are already independent of old catalog text. No live payment or Stripe provider sync was performed.

### 2026-10-06 — Regular site prices and INFLUENCE redemption

Owner requested regular homepage prices, promotion-only offer pricing and code INFLUENCE. Shared public pricing, Express catalog, Professional fit guide and initial checkout now use catalog amounts. The creator page alone displays conditional 15% offer prices and the code. Checkout’s Apply control previews a build-only discount; server validation requires explicit valid redemption on an eligible new order. Recurring fees, staff quotes and existing order amounts are preserved; invalid/disabled/ineligible codes cannot create an order or payment session. Existing promotion retries keep saved amounts and cannot stack. No schema change or Stripe coupon creation. Supabase description migration 20261006000027 was also verified applied, with unchanged prices/plans/entitlements.

Verification: exact release source excluding unrelated admin/Design Engine work passes full lint, standalone typecheck, 296 tests / 49 files and production build without provider environment files. Sixteen desktop/mobile browser checks confirm ordinary prices, creator-only offer/code, invalid-code feedback, explicit redemption, Enter-key apply, cleared-code reset, annual recurring-price preservation and locked quote protection. Checkout UI checks render the actual component through a temporary local-only fixture with a read-only catalog snapshot; no payment, booking or live order was submitted. Fixture source is outside the Git repository and is excluded from deployment. Server tests cover missing/invalid/disabled/ineligible codes and unchanged recurring prices/provider line items. Evidence: `docs/business/evidence/influence-*`.

### 2026-10-06 — Compact checkout and automatic promotion entry

Simplified checkout into compact hosting-plan selection, business details and an order summary. Website scope and the selected plan’s features remain available in native disclosures; recurring charges, applicable tax, agreement/refund text and errors remain at the payment action. Promotion purchase links carry the published INFLUENCE code through Express template selection and the Professional fit guide, independently of analytics/session attribution. Eligible initial checkout fills and applies that code immediately; ordinary checkout, staff quotes and existing orders retain their existing pricing behavior. Server validation and Stripe line items are unchanged.

Verification: exact staged release source excluding unrelated admin/Design Engine work passes full lint, standalone typecheck, 298 tests / 49 files and production build. Ten browser checks cover automatic Express/Professional redemption, annual recurring totals, manual invalid/corrected codes, ordinary pricing, quote exclusions, disclosures and desktop/320px/390px layout with no browser errors. Local checkout uses the real component and a read-only catalog snapshot in a temporary fixture outside the repository; no payment or order was submitted. Production release follows the previously authorized main → Vercel workflow. Evidence: `docs/business/evidence/checkout-cleanup-*`.

### 2026-10-06 — Promo routing during client navigation

Live verification exposed an Express navigation timing issue: reading `window.location.search` during a route render could see the previous page’s URL. Campaign links now use App Router search parameters with their own Suspense fallback, preserving prerendered public links and reactive query updates. This also keeps analytics query handling aligned with the current route.

Verification: exact staged source passes lint, typecheck, all 298 tests / 49 files and production build. Optimized-build browser checks on actual public pages confirm Creator → Express retains INFLUENCE without refresh, and home → ordinary Express does not inherit a promo from session attribution. Zero browser errors; no payment or order submission. Evidence: `docs/business/evidence/checkout-navigation-*`.

### 2026-10-06 — Publish staff Lab and named variant export

Owner authorized making the editor live. Isolated the standalone staff Design/Composition Lab release from unrelated customer-project, provider, checkout and schema edits. Included all renderer/preview dependencies and referenced review media, preserved staff authorization, added desktop Admin Lab navigation and named Site Definition exports. Pages → Portable site document now names a variant and downloads an independent `.site.json` with all pages/layers/actions/global slots. JSON import restores it; browser draft still holds only one working site. The repository handoff guide explains three designs and media/notes requirements.

Isolated release verification passes: 1,350 tests / 73 files, typecheck, lint, optimized production build, 28 lab workflows and five independent named export/import checks. Deployment follows the established main → Vercel integration; exact commit/live checks are recorded in `docs/design-engine/editor-release/evidence/live.json`. Customer-project pipeline files and migrations remain excluded. No real inquiry/newsletter submission or Express variant generation is part of this release.


## 2026-10-08 — Private image egress incident fix (local release candidate)

Diagnosed minute-by-minute re-downloads of signed originals in Supabase gateway
logs: 57 requests per hour for one photo, with fresh signed tokens. Storage was
155.218 GB on October 4 versus 59.094 MB PostgREST. Whole-route background
refresh and rotating preview URLs caused the loop.

Stopped healthy-Realtime and hidden/offline refreshes; stabilized subscription
dependencies; disabled automatic dashboard refresh in the Lab; retained valid
private image preview URLs; removed video tile preloading; paused hidden-tab
domain/deployment polls. Eight regressions and the full 1,601-test working
checkout suite pass, along with type checking, changed-file lint and production
build. A real Chrome fixture confirms 57 re-signs cause one image HTTP request,
with renewal and replacement still working.

Release candidate is isolated from unrelated uncommitted work on
`codex/fix-storage-egress`. No production release or Supabase billing change is
claimed. HTTP 402 restrictions still block live login until service restoration.
See `EGRESS-INCIDENT-2026-10-08.md` for evidence, limits and billing implications.

Isolated release validation also passed: 77 test files / 1,585 tests, type
checking, changed-file lint and production build, without the unrelated work.


## 2026-10-08 — Follow-up runtime reliability/cost audit

Reviewed the published image-fix baseline for remaining media loops, cancellation,
job leases/retries and billing delivery recovery. Reproduced and corrected three
additional failure paths: ZIP cancellation did not abort Storage fetching; failed
or abandoned billing events were acknowledged without recovery; serial job
batches could expire waiting leases and ignore final-write errors/ownership.

Archives now propagate cancellation and byte-based backpressure. Billing events
claim failed/stale receipts atomically and guard completion against newer claims.
Jobs claim one at a time with a start budget and guarded, checked result writes.
Checkout executes at most one inline job, leaving child work to the runner.
No schema migration, billing-setting change or asset deletion is included.

Validation: 77 files / 1,594 tests; typecheck; full lint; production build; and
committed migrations/RLS assertions in disposable local PostgreSQL all passed.
Production-config build reads still report Supabase's egress restriction, so
live authenticated service restoration is not claimed. Unpublished Professional
changes remain excluded. Scope, evidence and remaining limits are documented in
`RUNTIME-AUDIT-2026-10-08.md`.


## 2026-10-11 — Lab client workspaces and Express catalog

Added project-bound Professional editor routes and provisioning-time design workspace creation, plus a separate staff Express library with creation, duplication, metadata editing, private draft saves, publishing, recoverable removal and restoration. Public previews, template selections and checkout use published snapshots. Customer repositories retain their own copies. Luxe imports the latest authored browser composition; legacy templates retain HTML editing. Migration 0030 exposes only published template snapshots publicly; migration 0028/0029 mirror already-applied production history.

Release validation uncovered extensionless Google Inter download URLs on the clean CI runner. Inter 4.1 is now bundled from its official distribution with its OFL license and shared by both root layouts; the existing CSS variable and font weights are preserved. Production uses the documented Webpack build option. Builds without Supabase configuration safely render an empty catalog rather than failing during prerendering.

The public Express catalog now aligns its introduction, pins industry/variant and size controls below the public navbar, adds a Lab-style dotted canvas, and centers the preview within the remaining viewport. Replay remounts the selected preview to restart page motion and return to its start without changing its variant or size. Browser verification covers laptop, desktop and 320/390px phones, pinned offsets, overflow, and replay on component and legacy HTML templates.


## 2026-10-11 — Neutral website package finder

Replaced the Professional sales walkthrough with `/find-your-fit`: three unselected question groups covering page scope, design flexibility and functionality, followed by a centered recommendation with project-specific reasons, catalog pricing, a bright reveal and finite confetti (disabled for reduced motion). The guide retains the previous Professional layout with Virtue in the left panel, questions on the right, and flat backgrounds throughout. It occupies the viewport beneath the navbar and omits the footer. Express leads to the published design catalog, Professional to its build checkout, and Growth to the existing scope-call quote workflow. Growth retains the internal `custom` kind; migration 0031 aligns the public build-price name without changing amounts, entitlements or historical orders. The recurring Vigil Growth plan remains separate.

Home, website pricing, subscriptions, the public navigation and all product-page primary CTAs now enter this guide. The old Professional URL redirects with its query intact. Subscription and billing-period preferences survive the finder and Express design selection into checkout; they do not influence the build recommendation. Removed the preferential Express highlight from website pricing. Campaign promotions include the new route.

Validation: recommendation and purchase-handoff regression coverage, full 2,064-test suite, changed-file lint, production build, migration/RLS validation and regenerated database types (unchanged). Chrome checks cover all three recommendations, actual Professional checkout with Care/annual selected, Express purchase links with the same preference, Growth scheduling, legacy redirect, editing answers, and 1710px desktop / 1366×768 laptop / 390px mobile layouts. Browser CTA audit confirms the shared destination across Home and all product pages.

## 2026-10-11 — Contextual package guidance

Expanded the finder into seven core questions on business stage, primary outcome, pages, design, functionality, timing and optional upfront budgeting. Relevant answers trigger clarification of primary pages versus CMS entries, brand individuality versus original development, existing-service connections versus custom workflows, and launch-material readiness. The guide offers a focused first launch only when no required system/content capability would be lost, and only changes scope after explicit visitor consent. Deferred work remains in the resulting launch plan. Stage and budget never cause an automatic upsell, and urgency or insufficient budget never silently removes essential requirements. More than eight standard primary pages can remain Professional with separately quoted scope rather than automatically requiring Growth.

Current catalog prices provide the budget reference; build amounts and subscription preferences remain separate. Unknown scope, fixed deadlines, insufficient funds, missing material readiness or urgent tailored/custom work require a planning call before purchase. Express's two-business-day first look is explicitly distinguished from deployment. Recommendations include a build-now/add-later plan and timing/budget notes, with celebratory reveals only when no unresolved constraint remains. Virtue, flat backgrounds, the navbar and footer-free viewport remain; later mobile steps compact the repeated introduction so questions stay accessible.

Validation: 48 focused guidance/flow tests, initial full suite (89 files / 2,095 tests), changed-file lint, typecheck and production build. Chrome checks covered one-page from-scratch clarification, a low-budget call outcome, explicit lean-launch consent, retained deferred work, preserved Care/annual purchase routing, edit/back branch changes, booking-popup action and responsive layouts. Subsequent CI validates the final complete suite, including the additional below-Express-budget regression. No schema or price changes.

## 2026-10-11 — Direct package exploration and guidance callout

Home, Pricing and Products website cards now link to their corresponding build: Express catalog, Professional details or Growth details. The Websites overview retains its direct in-page package links. Each of these card groups has a prominent shared Virtue guidance panel below it, with a clear finder action and goals/timing/budget explanation. Professional's detail action leads directly to its build checkout; Growth's opens the scope-call quote popup. Subscription selection continues to preserve plan/period preferences through the guide. Card actions use secondary styling so the separate guidance action stands out.

Cursor contrast now follows the nearest marked surface: dark homepage cards use white even inside the green band, while green surfaces/buttons still use black and inputs/embedded previews retain native cursors. Added top clearance for the fixed homepage navigation when viewing the larger package group.

Validation: changed-file lint, production build/typecheck and Chrome checks of package-specific links, checkout/quote actions, cursor computed white fill on dark cards and responsive callout placement. No schema or pricing changes.

## 2026-10-13 — Marketing performance while retaining motion

Reduced home startup work with an exact-edge native wireframe projection,
pre-hydration native animation clocks adopted by React, deferred scroll/motion
and shader runtimes, offscreen drawing pauses, a glyph-equivalent 49 KB Inter
subset with complete-character fallback, deferred booking widget and route
prefetch, and below-fold rendering containment. Original typewriter cadence,
shader visuals, easing, spring lift, scroll story and live catalog remain.

Cold-cache clean Vercel preview: desktop 100 performance / 100 accessibility /
100 best practices; mobile 96 / 100 / 100. Production-mode SEO remains 100;
protected previews have an expected noindex SEO deduction. Full suite: 98 files /
2,219 tests; production build with TypeScript, changed-code lint, four original
Three.js geometry parity tests, font outline/advance parity and desktop/phone/
reduced-motion interaction checks. Report and evidence:
`docs/performance/2026-10-13/REPORT.md`. Production has not been published.

## 2026-10-13 — Live mobile rendering follow-up

Google's live PageSpeed run confirmed desktop 100 / 100 / 96 / 100 and mobile
88 / 100 / 96 / 100 after the initial release. Its mobile trace attributes the
remaining delay to render-blocking styles and headline paint; blocking time is
60 ms. Inline the same production CSS to remove the extra stylesheet round trips
and start the native intro immediately, preserving its 30 ms / 12 ms character
rates, 250 ms gap, CTA fade and native-to-React clock adoption. No animation or
feature is removed. The separate Supabase preview integration reports a remote
migration-history mismatch; this marketing release changes no database files.

## 2026-10-14 — Content Hub dashboard UI continuation

Aligned Content Hub with shared dashboard theme tokens and full width; centered the crown upgrade wall and added navigation crown indicators. Renamed Website Preview, hid completed launch previews and moved each live website's operations/export tools to Overview. SiteFrame now transitions its actual phone container width and height with reduced-motion support. Recorded availability/DNS/SSL and production releases drive accessible charts; unconnected traffic/performance/SEO sources remain explicit empty states. See `docs/launch/dashboard-ui/REPORT.md` for validation, release boundaries and screenshots.

## 2026-10-16 — Vercel domain discovery and saved external handoff

Implemented the independent search/handoff slice on freshly fetched shared main in `codex/vercel-domain-journey`. Public credential-free Vercel exact-name discovery returns real advisory USD prices; Continue saves a website-bound, versioned intent before external navigation. Domain/onboarding share the UI and Overview resumes the saved next step. Migration 0047 enforces tenant reads, service-only serialized writes and actual customer owner/manager authorization. Staff impersonation cannot authorize customer DNS. Existing own/need/unsure/later and registrar answers remain compatible. `DOMAIN_HANDOFF_ENABLED` defaults off for controlled rollout/rollback.

**Full connection objective remains incomplete.** Current Vercel resource permissions remain private beta; no authorized cross-account fixture/consent and revocation path was proven. Connect stays disabled, with honest assistance guidance; no DNS/provider connection jobs, registrar billing/purchase calls or connected notifications are created by the new journey. Scar was verified read-only as Building, live URL null, zero domains, both review rounds approved; those approvals are not launch authorization.

Fresh initial validation: 116 files / 2,372 tests, typecheck, full lint and disposable PostgreSQL migrations/RLS pass. Build/release/browser/migration final receipts and limitations are maintained in `docs/dashboard-v1/vercel-domains-2026-10-16/REPORT.md`; the feasibility decision and unsent provider inquiry are in `FEASIBILITY.md`.

## 2026-10-16 — Staff domain discovery and Connect feasibility follow-up

Staff view now displays the exact-name search field and permits credential-free
discovery with tenant validation and fail-closed rate limiting. Saving, replacing
or cancelling a choice remains restricted to a real customer owner/manager.
Refreshed Phase 0 research adds classic Integration OAuth as a candidate and
documents its broad DNS/registrar permission overlap; no configured customer app
or authorized separate-account fixture was established, so automatic Connect
remains disabled. Fresh 2,381 tests / 118 files, typecheck, lint, build and
disposable migrations/RLS pass. No migration, DNS or customer launch change.
See `vercel-domains-2026-10-16/CONNECT_FOLLOWUP.md` for release evidence and limits.

## 2026-10-16 — Two domain setup paths

The Domain page now starts with Find your domain / Already own one icon cards,
then shows only the selected path. Discovery progresses from search to price
review to saved connection intent; owned-domain entry navigates to its guide
after saving. Back navigation preserves durable choices, returning customers
resume their progress, and Overview identifies the correct website. Secondary
connection details are collapsed. No DNS automation or customer launch is added.
Fresh route and redirect regressions cover the focused flow; final validation and release notes are in
`vercel-domains-2026-10-16/DOMAIN_UX.md`, including the remaining division of work
for customer consent and cross-account automation proof.

### 2026-10-16 — Center Domain guides and establish the exact provider dependency

The Domain chooser now uses a centered 4xl column and either guide a centered 3xl column, including its header and back navigation. The group is also vertically centered in the available dashboard viewport; longer guides grow naturally and remain scrollable. Registered Vigil Domain Connect in the existing Vercel team; its unfiltered permissions expose only OpenID scopes, not Domains access. No resource grant, client secret, callback, customer DNS mutation or launch occurred. Automatic connection remains disabled under the original Phase 0 gate. AUTOMATIC_CONNECTION_SETUP.md contains the public app identity, precise unsent support request, authorized fixture requirements and remaining engineering work. Local checks and Preview/release receipts are recorded under vercel-domains-2026-10-16/evidence/domain-center.

### 2026-10-16 — One-task guided manual domain setup

Replaced the simultaneous DNS checklist with a shared one-screen-at-a-time wizard, including separate type/name/value/save screens, local navigation resume, focus, copy feedback and help. Purchase handoff now continues to a prefilled manual setup; same-site retries resume rather than detach an existing association. Domain and onboarding use ownership-only TXT staging before launch, a distinct waiting state and provider requirements after authorized production activation. Vercel recommendations are read for the actual project and missing targets fail closed. No beta authorization, automated customer DNS, registrar operation, schema change or customer-site launch is included. See vercel-domains-2026-10-16/GUIDED_SETUP.md and its validation receipts.

### 2026-10-16 — Clarify domain purchasing for customers and staff view

Search results now highlight availability, domain identity, a large accent-colored
registration price, a separate renewal estimate and an explicit Buy this domain
on Vercel action. Plain instructions explain the new tab, customer account and
return to guided setup. Staff can open the exact public domain page without
saving a customer choice. Saved handoffs keep the Vercel purchase link prominent
and label setup as the action after buying. Customer authorization, server-side
requotes, allowlisted URLs, manual DNS and launch safeguards are unchanged.
Validation/release receipts: vercel-domains-2026-10-16/evidence/purchase-clarity.

### 2026-10-17 — Explicit return from domain purchase

After opening Vercel, the handoff screen now prioritizes I’ve bought it — continue setup, followed by the optional Return to Vercel link. Domain confirmation is prefilled and ownership is checked through the existing manual guide. A public-link click in Staff/read-only view now advances to a local preview of this next screen without saving a customer intent; the existing role-protected setup route can be inspected. Customer persistence and permissions are unchanged. A return or acknowledgement is not payment or ownership proof; there is no new callback, beta API, DNS mutation or customer launch. See vercel-domains-2026-10-16/evidence/purchase-return for validation and release receipts.

### 2026-10-17 — Continue purchased-domain setup without redundant questions

The saved Vercel handoff now submits directly to the existing pending-domain action, with tenant, website, customer role, selected-name and intent-version validation. Returning customers go straight to Domains in the purchasing account, skipping domain entry, provider selection and sign-in acknowledgements. This context also resumes in onboarding. Type, Name, Value and saving one record now share a single screen, with individual copy controls, default-setting instructions and an explicit return to Vigil for the existing ownership checker. Vercel navigation uses its documented team picker and simplified code-native illustrations. Staff can preview these instructions without saving a domain or generating a verification token. No beta capability, purchase confirmation, automated customer DNS, schema or launch change is included. See vercel-domains-2026-10-16/SETUP_CONTINUITY.md and evidence/setup-continuity.

### 2026-10-18 — Verified domain milestones and staff readiness alerts

The guide now encourages progress, shows clear verification/connection badges and celebrates each real milestone once with reduced-motion support. Ownership readiness remains distinct from a live connection. Migration 0048 atomically saves one staff inbox event and email outbox job when trusted prelaunch ownership succeeds, with tenant/role protection and a durable deduplication key. Email retries use frozen messages and provider idempotency; database failures are propagated before reporting readiness. No beta API, customer DNS write, review approval or customer publication is added. In-app alerts work independently of email. A valid Resend credential is still needed to enable email copies; the available credential failed read-only validation. See vercel-domains-2026-10-16/DOMAIN_READINESS_ALERTS.md for rollout, rollback and validation limits.

### 2026-10-18 — Actual customer domain management for administrators

Administrators now use the actual customer domain journey in the selected account, including saved search choices, post-purchase continuation and the real verification checker. Old preview links resolve into this flow. An explicit admin banner identifies persisted changes. Migration 0049 rechecks administrator authority for advisory choices and adds a transactional, audited reset for unpublished manual setups, with stale-tab protection, canceled waiting jobs, archived history and fresh proofs for subsequent setups. Production connections and registrar permissions remain separate. Scar is not reset for QA. See vercel-domains-2026-10-16/ADMIN_DOMAIN_MANAGEMENT.md for boundaries, rollback and validation.

### 2026-10-18 — Keep domain setup open through the final connection

Ownership verification now remains an unfinished waiting step with explicit additional-record instructions. When provider requirements arrive after approved production preparation, the shared Domain/onboarding guide continues directly to one additional record at a time. Duplicate-name TXT challenges have separate-record instructions, and old local navigation cannot skip the new phase. Only a fully connected domain with DNS, SSL and expected-site checks can show completion, 100% progress and confetti. Onboarding labels unfinished setup explicitly. No schema, DNS, approval or customer-site publication change is included. See vercel-domains-2026-10-16/FINAL_CONNECTION_GUIDE.md and its validation/release receipts.

---

## 2026-10-22 — Lead Hub design alignment with Content Hub

- Rebuilt the authenticated inbox, unread view, contact preferences and inquiry-detail presentation using existing Content Hub proportions, tokens, navigation and table styling; added compact phone/tablet layouts and keyboard focus treatment.
- Preserved existing contact/notification actions and launch gates, added tenant-scoped unread filtering, normalized search inputs and context-preserving pagination/back navigation. Distinct empty/search/out-of-range states avoid misleading inbox messages.
- Scar’s capture remains disabled pending website/domain launch. The UI reflects that state rather than suggesting a live connection. No production leads or outgoing notifications were created.
- Validation: 85 focused tests, TypeScript, focused lint, optimized production build, and 24 Chrome layout checks in both themes. Local-only sample lab: `node scripts/preview-lead-hub.mjs`, port 4187. Details in `docs/launch/lead-hub-design/REPORT.md`.

---

## 2026-10-22 — Break the first-launch domain/content dependency

- Added a read-only published-content delivery gate for approved Building sites whose exact production build, provider association, ownership, routing DNS and SSL already pass. This lets the real homepage render for its final HTTPS check without setting Live early or exposing drafts. Ordinary live/review delivery and database eligibility remain intact; no schema change.
- Domain verification returns the production deployment it actually checked, so manual jobs with no deployment payload and stale deployment-bound jobs can finish the existing launch service. Expected DNS waiting no longer consumes the domain job’s failure budget; real errors remain bounded.
- Scar’s customer DNS and review approvals are unchanged. Production rollout will use the existing verifier and launch/contact automation. Diagnosis and validation scope: `docs/launch/domain-launch-cycle/REPORT.md`.

---

## 2026-10-22 — Personal Lead Hub reply platform

- Added a personal reply preference in Lead Hub Settings: Gmail, Outlook.com, Microsoft 365 Outlook, or the device’s default email app. The signed-in user’s non-sensitive Auth metadata stores one allowlisted value across devices; staff viewing a customer still changes only their own preference. Website notification and booking preferences keep their existing role restrictions.
- Inquiry details open an addressed draft with a short subject in the selected platform. Fixed provider origins, encoded recipients, single-mailbox validation, new-tab isolation, and safe fallback handle unsupported metadata and malformed contact addresses. Opening a draft does not send email, change lead status, or synchronize external conversations.
- Reused the existing settings styling and form behavior, with an opt-out from successful form reset so the new selection remains visible. The local sample lab supports saving the preference across its native page navigations via sessionStorage; production persistence uses Auth, not browser storage.
- Validation: all 2,559 tests passed (129 files), TypeScript, focused ESLint, and the optimized production build. Release/browser verification is recorded in docs/launch/lead-reply-platform/REPORT.md.

---

## 2026-10-23 — Connected Gmail drafts inside the full inbox

- Replaced the standalone Gmail compose handoff with a personal Google OAuth connection and server-created draft flow. Replies quote the original inquiry and open the saved draft in the connected account’s full Gmail interface. Existing drafts are reused without overwriting user edits; no reply sending or mailbox ingestion is added.
- Added state/PKCE/cookie/CSRF protections, tenant and user checks, lease-based draft preparation, reconnect/disconnect, private Vault credential storage, credential cleanup, setup gating, email-app fallback and a focused Google-data privacy disclosure. Migration 0050 is applied and remote database types regenerated.
- Validation: 2,601 tests passed; TypeScript, focused lint, production build, full database suite and 21 Gmail SQL assertions passed. A synthetic draft verified the full-Gmail URL and quoted-context presentation in Chrome. No email sent.
- Google client setup remains an activation dependency: current Cloud account cannot create OAuth clients in vigil-studios. No real customer Google authorization/token exchange has been completed. Setup and exact validation limits: docs/launch/lead-reply-platform/GMAIL_CONNECTION.md.

---

## 2026-10-26 — Open the admin console immediately after sign-in

- Password sign-in, PKCE callbacks and confirmed email links now resolve the authenticated user's `staff_members` role under RLS before choosing a destination. Admin/staff accounts land at `/admin` instead of client Overview or onboarding, including when an older sign-in link carries a customer dashboard destination. Explicit admin deep links and non-dashboard destinations remain usable.
- Existing sessions visiting `/login` use the same role-based destination policy in the login page. Removed the proxy's unconditional `/dashboard` redirect, preserving its refreshed session response. Customer sign-in/onboarding behavior and intentional Client view access from the admin console are unchanged; no authorization, tenancy or schema changes.
- Local validation: all 2,632 tests (133 files), full lint, typecheck and optimized production build passed. Added 29 regressions for every sign-in entry point, stale destinations, role isolation, failed login/role lookup, legacy token retry and refreshed-cookie preservation. Local browser verification reached the sign-in form successfully; this browser had no authenticated admin session, so a real-account sign-in was not performed. Available at `http://127.0.0.1:3190/login`; not deployed.

---

## 2026-10-26 — Website-first live client overview

- Introduced a dedicated postlaunch overview with the actual website preview and recorded health checks first, inquiry trend/status charts, an actionable New-inquiry queue, traffic connection states, coming-soon Insights, recent activity/releases and a compact plan/service section. Prelaunch accounts retain their existing onboarding overview. Multi-site selection remains tenant-scoped.
- Added interchangeable chart views, 7/30/90-day reporting, keyboard exploration and personal panel ordering, widths, visibility and reset/save controls. Preferences update only the signed-in user's allowlisted Auth metadata, including for staff in Client view; failed saves preserve the draft. Small screens stack panels.
- Read models use RLS and both organization/website filters, paginate historical rows, aggregate on the server and explicitly flag bounded history. No traffic, uptime, conversion, security or revenue statistics are invented. Customer analytics is unconnected; Insights is not activated. No schema, provider, customer-site or admin-layout change.
- Validation: all 2,654 tests / 137 files, full lint, typecheck and optimized build pass; actual authenticated overview and a loopback-only sample lab cover layouts, chart controls, drag/keyboard interaction, persistence, errors and responsive states. Local only. Design/data boundaries and repeatable previews: `docs/launch/client-overview/REPORT.md`.


---

## 2026-10-27 — Readable, structured live overview with direct swaps

- Increased dashboard text and chart labels, retained only the page eyebrow, added header icons and replaced the layout editor with direct drag/grip, keyboard and touch/pen swaps. The website and integrated Vigil plan occupy two thirds of row one, with compact recorded health checks alongside. Row two contains green-gradient Insights, traffic, inquiry trends and narrower lead status at a shared height; swaps preserve panel widths. Inbox/activity exchange fixed three-quarter/one-quarter positions and render expanded or simplified content accordingly.
- Simplified card gradients to vertical borders/fills, fixed translucent dark-surface bleed, removed chart dots and the preview's inner green wrapper, made donut ends flat with a near-background track, and gave the desktop preview a physical 340px viewport without stretching. Mobile preview dimensions remain unchanged.
- Added a validated deployed-brand color projection and a bounded public Vercel-build fallback for older custom websites. RLS checks precede access to immutable palettes; every source is scoped by organization and website. Public fallback forbids arbitrary hosts, redirects, credentials and third-party styles. Scar's real preview uses its published pink token. No customer site, provider, schema or access setting changes.
- Personal preferences now use an allowlisted v2 shape and serialized automatic saves; failures retain the draft with retry. Full validation: 2,668 tests / 139 files, full lint, typecheck and optimized build passed. Browser checks cover actual customer data, both themes, fixed-width report swaps, adaptive inbox/activity swaps, persistence/errors and 320/390/768px overflow checks. Local only; application 3190 and fictional lab 4188 remain available. See `docs/launch/client-overview/REPORT.md`.


---

## 2026-10-27 — Preserve desktop preview proportions and stack lead status

- Replaced the overview's fixed 340px preview height with a stable 1200×1000 virtual desktop viewport. The displayed height now scales with width, preserving the website layout and giving the preview more height; the phone remains 390×780 and other SiteFrame consumers retain their default viewport.
- Moved lead status beneath health and security in the first row's right column. Insights, website traffic and inquiry trends now occupy three equal, wider columns in the next row. Their swaps and the adaptive inbox/activity row remain available. Existing v2 preferences normalize status into its new fixed position while retaining valid report order, chart choices and working slots.
- Validation: 37 focused overview tests / 6 files, typecheck, focused lint and optimized build passed. Browser checks verified 1200×1000 desktop and 390×780 phone frames, proportional display dimensions, three equal report widths, native/keyboard swaps and 320/390px layouts without horizontal overflow. Local only; server remains on 3190.


---

## 2026-10-27 — Fit the website preview to the status stack

- The health/security and lead-status stack now determines the first row's height. CSS size containment lets the website card stretch to the same height while its preview fits proportionally into the remaining space above the plan controls. The browser frame supplies its viewport ratio as a CSS token; named dashboard container queries keep responsive layout rules separate from the preview's height container. No extra measurement loop or fixed card height is needed.
- Reduced the desktop viewport slightly to 1200×900 (4:3); phone stays 390×780. Both modes scale to fit in the desktop card. Narrow layouts retain natural card heights and full-width previews.
- Validation: 37 focused overview tests / 6 files, typecheck, focused lint and optimized build passed. Browser checks confirmed matching 616px cards, dynamic matching at 670px in Bars view, fitting desktop/phone frames without overlapping the plan, a collapsed-sidebar layout and 320/390px layouts without horizontal overflow. Local only; server remains on 3190.


---

## 2026-10-27 — Website context, Vigil Security and compact site quality

- Kept the approved 616px desktop row height. The website preview is slightly larger and left aligned, with the Live website eyebrow, linked domain and recorded availability/SSL/DNS checks to its right; the Vigil plan stays below. Vigil Security takes the upper right, with Lead status and the new Site quality card splitting its lower row at unchanged height. Mobile layouts retain natural website sizing and paired compact cards.
- Added a custom vigilante-eye header, secured/warning shields and blue/orange vertical gradient states, Overview/Alerts switching, per-category monitoring status and scrollable alert details. Secured requires current, complete, clear checks; unresolved alerts remain visible after expiry, without claiming stale firewall protection. Real monitoring and audit feeds are absent, so the authenticated read model explicitly supplies null and the UI displays unconnected/unmeasured states. No scanner, firewall change, provider setup or background service is created.
- Site quality supports measured SEO and Performance scores, raw LCP seconds, device and audit time. Compact CRM groups retain all non-spam cohort statuses in Donut/Bars views; existing report/work swaps and saved chart preferences remain. Older v2 layouts gain the quality card without losing their report order.
- Validation: full suite 2,684 tests / 140 files, then 37 focused tests / 3 files after tightening stale status rendering; typecheck, focused lint and optimized build passed. Browser checks covered the real customer site, both themes, blue/orange/unconnected states, alert details, fixed 616/341/263px geometry, larger proportional phone preview and 320/390/768px layouts without horizontal overflow. Local only; application 3190 and sample lab 4188 remain available. See `docs/launch/client-overview/REPORT.md` for data boundaries.


---

## 2026-10-27 — Preview transitions, chart polish and dashboard scroll containment

- Preserved the approved preview/card dimensions while making website metadata fill the space beside the actual desktop frame with an 8px gap, including when the sidebar is collapsed. Mobile mode centers within that desktop area. Frame width/position and native iframe viewport dimensions animate together over 420ms; a stable dimensional read hook maintains uniform scaling without remounting the iframe. Reduced motion skips transitions.
- Swapped Site quality and Lead status. The status view control now hugs its buttons on the right; the donut has more interior space and a singular caption for one inquiry. Trend SVGs use their measured width and full plot endpoints, retaining keyboard exploration and readable labels. Recent activity has colored timeline dots and release rows/empty states use box icons.
- Reproduced a second vertical scroll region that moved the complete dashboard offscreen after reaching the footer, plus focus scrolling inside the hidden frame. The authenticated frame is now pinned and clipped, with scoped root overflow locking, zero minimum flex heights and contained main/navigation scrolling. Login/public pages without a frame retain ordinary document flow. Verified repeated footer scrolling and control focus leave document/frame scroll at zero and the header at y=0.
- Validation: 46 focused tests / 5 files, typecheck, focused lint and optimized production build passed. Browser checks covered real customer desktop/phone previews, the preserved 616px row, expanded/rail spacing, the reordered 263px status cards, chart endpoints and keyboard selection, timeline/release details, both themes, and 320/390px document/card overflow. Local only; servers remain on 3190 and 4188. Details in `docs/launch/client-overview/REPORT.md`.


---

## 2026-10-27 — Customer sidebar branding and grouped website navigation

- Added roomier website-card padding, a larger domain link with readable label breaks, and more space between the live-site identity and its connection checks. The first row retains its 616px height.
- Customer workspaces resolve their default live site's icon from the RLS-scoped published production deployment, with tenant/site filters and a publication-time bound. Public HTML reads reuse the existing Vercel-origin, size, timeout, cache and redirect restrictions. Icons are dynamic across customers; missing/unavailable/failed images show the theme-aware Vigil logo. No customer-specific URL is hardcoded in production and no website/provider data is changed.
- Grouped Content Hub through Subscription (and applicable preview/review links) under Website. Website and Grow start expanded and collapse independently with animated height/opacity and chevrons. Collapsed links are inert; state labels/control IDs work in expanded and rail navigation and the mobile drawer. Existing entitlement and coming-soon behavior remains. Reduced motion skips animations.
- Validation: 38 focused tests / 5 files, typecheck, focused lint and optimized build passed. Browser checks verified the actual customer's sparkle icon, independent/keyboard group toggles, default open state, absent/broken image fallbacks, light/dark branding, drawer accessibility, unique IDs and 390px overflow. Local only; servers remain on 3190 and 4188. See `docs/launch/client-overview/REPORT.md`.


### 2026-10-27 — Inset the website details column

- Added 12px of padding on each side of the website details at desktop widths and 8px in compact desktop layouts. The narrow layout reserves a little more column width for readable content. Stacked mobile details retain their existing spacing.
- Browser verification confirmed both 12px insets, no details overflow, the unchanged 461px desktop preview and 616px first row. CSS-only follow-up; no application tests rerun. Local server remains on 3190.

### 2026-10-27 — Reliable overview drag handles and rounded drag tabs

- Replaced the split native mouse/touch behavior with pointer capture shared by movable headers and explicit dot-handle handlers. The grip SVG no longer intercepts input, small clicks do not reorder panels, and mouse/touch/pen follow the same movement threshold. Existing row restrictions, exact swaps, adaptive working slots and serialized personal saves remain.
- Added a rounded 12px floating title tab outside the scrolling/container-query surface, with opaque light/dark surfaces. Valid targets highlight; edge scrolling supports stacked layouts. Escape, cancelled gestures, lost capture and window blur clear the drag; unmount cancels the animation frame. Keyboard arrows remain available.
- Validation: 24 focused tests / 3 files, typecheck, focused lint and optimized build passed. Browser checks verified dot-origin report swaps in both directions, working-panel adaptation, keyboard swaps, Escape cancellation, invalid cross-row drops, reload persistence, live rounded previews in both themes and 390px swaps/edge scrolling without horizontal overflow. No new console errors. Real customer data remained unchanged; local servers stay on 3190 and 4188.
