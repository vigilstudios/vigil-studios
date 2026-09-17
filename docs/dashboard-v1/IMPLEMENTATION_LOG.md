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
