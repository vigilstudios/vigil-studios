# Dashboard V1 — Implementation Log

Branch: `claude/dashboard-v1-foundation` (in `vigil-studios`). `main` untouched;
production deploys only from `main`.

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
