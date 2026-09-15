# Vigil Dashboard V1 — Architecture

**Status:** Implemented foundation on branch `claude/dashboard-v1-foundation` (see `IMPLEMENTATION_LOG.md`)
**Source of truth for product direction:** `../../../vigil-leadgen/VIGIL_STUDIOS_MASTER_ARCHITECTURE.md`
**Written:** 13 Sep 2026

This document records what the repository looked like before Dashboard V1, the
design decisions the foundation is built on, and the boundaries that later
phases (domains, Stripe, Vercel, Requests, Leads, Insights, Virtue) must respect.

---

## 1. Repository audit (13 Sep 2026)

### Two repositories, one product

| Repo | Stack | Role | Owner |
| --- | --- | --- | --- |
| `vigil-studios` | Next.js 16.2.9, React 19, Tailwind 4, `@supabase/ssr` 0.12, `@supabase/supabase-js` 2.108, framer-motion, zod, react-hook-form, resend (unused) | Public site `vigilstudios.co` (deploys from `main`), Express storefront (`/express`), **Dashboard V1 lives here** | Claude for the dashboard; Codex owns `components/express/*`, `public/express-templates/*`, `lib/express-accents.json` |
| `vigil-leadgen` | Python 3.11, SQLite, Jinja, Cloudflare Worker + R2 + KV | Express template engine, outreach pipeline, Express `orders`/`intake` tables, Stripe webhook at the edge | Codex/Astra — not touched by this work |

### What existed before this work

- **Auth/session:** `lib/supabase/{server,browser,middleware}.ts` created SSR
  clients and refreshed the session cookie on every request. Nothing enforced
  a login anywhere; there was no login page, no sign-in flow, no roles.
- **Authorization:** none. `app/client-portal/page.tsx` selected *the most
  recent project in the database* with no user scoping. `/admin`,
  `/client-portal` and `/supabase-test` were only hidden by a
  `NEXT_PUBLIC_ENABLE_DEV_ROUTES` flag in `middleware.ts`; `/supabase-test`
  dumped raw rows to the page.
- **Database:** `.env.local` pointed at Supabase project `fotqwyfoqzjmcchwjpof`,
  whose hostname no longer resolves in DNS (project deleted or removed). No
  migrations were checked in; the `projects` / `clients` /
  `project_phase_progress` tables referenced in code were created by hand.
  `types/database.types.ts` was an empty file. Practically: **there is no
  database.**
- **Integrations:** Vercel Analytics/Speed Insights, Calendly popup, a Stripe
  payment link constant (deliberately empty), Resend installed but no
  `app/api` routes exist. The Express purchase webhook lives in the
  `vigil-leadgen` Cloudflare Worker and writes to KV, not to Supabase.
- **Next.js 16 specifics:** `middleware.ts` is deprecated in favour of
  `proxy.ts`; `forbidden()`/`unauthorized()` are experimental. The docs in
  `node_modules/next/dist/docs/` are the reference, not training data.
- **Reusable foundations:** CSS design tokens and theme toggle in
  `app/globals.css` (`--bg-*`, `--text-*`, `--accent`, `--border`, `.glass`,
  `.btn-primary`, `.btn-secondary`, `.container-wide`); the Supabase client
  factories; `zod` + `react-hook-form`; `components/portal/*` visual pieces
  (build-progress portal for bespoke projects) kept intact for later reuse.
- **Baseline checks:** `tsc --noEmit` clean; `eslint` reports 9 pre-existing
  errors and 11 warnings, all inside marketing sections (`sections/*`,
  `components/layout/*`, `components/CalendlyModal.tsx`, `lib/constants.ts`).
  Those are out of scope and left as-is; the dashboard code must not add to
  the count.
- **Local tooling:** no Docker, no Supabase CLI installed globally. The CLI is
  usable via `npx supabase` (binary download works). A scratch PostgreSQL 14
  cluster is used to validate migrations and generate types.

---

## 2. Decisions

| # | Decision | Why |
| --- | --- | --- |
| D1 | Dashboard V1 lives in `vigil-studios` under two root layouts: `app/(site)` (existing marketing, unchanged) and `app/(vigil)` (login, client dashboard, admin). | The marketing root layout carries a snap-scrolling `<main>`, the marketing nav and JSON-LD. A dashboard cannot share it. Route groups are the idiomatic Next.js answer and the URLs do not change. |
| D2 | Client routes at `/dashboard/*`, staff routes at `/admin/*`, auth at `/login`, `/auth/*`. | Matches the master IA. The old dev-only `/client-portal` and `/supabase-test` routes are removed (they read a database that no longer exists). |
| D3 | Tenant = `organizations`. Users join through `organization_members` with roles `owner`, `manager`, `member`. Vigil staff are a separate table `staff_members` with roles `staff`, `admin`. | Two independent axes: *which business* and *is this person Vigil*. Keeping staff out of `profiles` means a customer can never edit themselves into staff — the only way in is a row only admins/service role can write. |
| D4 | Active organization is chosen server-side (cookie `vigil-org`, validated against membership every request, falls back to the first membership). URLs stay `/dashboard/website`, not `/dashboard/<org>/website`. | Most customers have one business. Authorization never depends on the cookie: every query runs under RLS keyed on `auth.uid()`, so a tampered cookie yields nothing. Can move to slug-in-URL later without touching the data model. |
| D5 | Security lives in the database (RLS on every tenant table) plus a server Data Access Layer (`lib/vigil/auth/session.ts`). `proxy.ts` only does optimistic redirects. | The master architecture requires that authorization not depend on hidden navigation; Next.js docs say the same about Proxy. |
| D6 | Provider identifiers never live on core tables. `provider_links(provider, resource_kind, external_id) → (entity_type, entity_id)` maps Stripe/Vercel/Cloudflare objects to Vigil entities. Customers cannot read `provider_links`. | Master architecture §7. Retries, reconciliation and provider migration become table operations. |
| D7 | Plans, prices, features and per-plan entitlements are **rows**, not code. Four plan codes are seeded (`basic`, `care`, `growth`, `priority`) with **no prices** and only structural feature flags. Anything undecided is `NULL` or absent. | Master architecture §4/§15: pricing, allowances, provider policy are not approved. The admin “Plans” screen edits them; code reads `resolveEntitlements()`. |
| D8 | Entitlements resolve per organization from the highest-ranked active subscription, overlaid with `entitlement_overrides`. Subscriptions carry an optional `website_id` so per-website plans remain possible. | Entitlement-based gating instead of plan-name checks (§9). |
| D9 | Lifecycle states are Postgres enums with an app-level transition table (`lib/vigil/lifecycle.ts`) **and** a database trigger that writes `audit_events` on every status change of projects, websites, domains, deployments, subscriptions, organizations and change requests (jobs keep their own log). | Auditable state transitions regardless of which code path made the change. |
| D10 | `provisioning_jobs` is a durable, idempotent job table (`idempotency_key` unique, attempts, backoff, lease). A runner route (`/api/jobs/run`, secret-protected, cron-friendly) drains it. Adapters are interfaces with `null` implementations. | Idempotent provisioning and safe retries (§9) without choosing a queue product. |
| D11 | `webhook_events` is a provider-neutral inbox keyed on `(provider, event_id)`; handlers are idempotent. | Provider webhooks plus periodic reconciliation (§9). Stripe/Vercel handlers are a later phase. |
| D12 | Migrations are checked in under `supabase/migrations/` and validated against a local PostgreSQL with an `auth` shim (`supabase/test/auth-shim.sql`) plus RLS assertion scripts. Types in `types/database.types.ts` are generated from that database. | No live project exists; this keeps the schema reviewable and reproducible. |
| D13 | No `stripe`, `@vercel/sdk` or Cloudflare SDK is added in this phase. Adapters are interface + `null` provider + a `not-configured` stub per named provider. | Provider choices for domains and deployment topology are undecided (§15). The interfaces are the deliverable. |
| D14 | Sign-in is email magic link via Supabase Auth (PKCE, `token_hash` confirm route). No passwords are collected in V1. | Calm for customers, nothing to leak, no password UI to maintain. Password sign-in can be enabled later without schema changes. |
| D15 | There is no self-serve organization creation. Staff create an organization and invite the owner by email; the invite auto-accepts when that email signs in. | Whether an Express purchase creates an org automatically is a product flow decision that belongs to the checkout phase. |
| D16 | Column-level rules (who may change `organizations.status`, `profiles.email`, `change_requests.assigned_to`, …) are enforced by the `vigil.protect_columns_from_customers` trigger, not by column GRANTs. | Staff and customers share the `authenticated` database role, so GRANTs cannot tell them apart; a trigger can ask `vigil.is_staff()`. |
| D17 | Any row that references a `website_id`, `domain_id` or `project_id` must point inside its own organization (`vigil.enforce_same_org_references`). | RLS checks the row's organization; without this a member of A could attach A's domain to B's website. |

---

## 3. Domain model

```
auth.users ──1:1── profiles
                │
                ├─< organization_members >── organizations ──< organization_invites
                │                                 │
staff_members ──┘ (Vigil staff, separate axis)    ├─< projects ──1:0..1─ websites
                                                  │                        ├─< deployments
                                                  ├─< domains ─────────────┘ (website_id nullable)
                                                  ├─< subscriptions ──> plans ──< plan_prices
                                                  │                        └─< plan_features >── features
                                                  ├─< entitlement_overrides >── features
                                                  ├─< usage_records
                                                  ├─< provisioning_jobs
                                                  ├─< audit_events
                                                  ├─< notifications (also user_id)
                                                  ├─< change_requests      (future product: Requests)
                                                  ├─< leads                (future product: Leads)
                                                  └─0..1 virtue_settings   (future product: Virtue)

provider_links (provider, resource_kind, external_id) → (entity_type, entity_id)
webhook_events (provider, event_id) inbox
```

### Lifecycle states

| Entity | States | Notes |
| --- | --- | --- |
| `projects.status` | `draft → intake → in_progress → review → approved → launched → closed` (+ `cancelled` from any pre-launch state) | The build engagement. Express projects skip `review` when the human gate passes. |
| `websites.status` | `provisioning → building → live ⇄ paused → archived`; `suspended` reachable from `live`/`paused` (billing); `error` from `provisioning`/`building` | The operated asset. `live` is what the customer sees as “Website Live”. |
| `domains.status` | `pending → verifying → connected`; `error` from `verifying`; `expired` from `connected`; `released` terminal | Customer sees “Domain Connected”. |
| `subscriptions.status` | `incomplete, trialing, active, past_due, unpaid, paused, canceled` | Mirrors normalized billing states; provider mapping in `provider_links`. |
| `deployments.status` | `queued → building → ready` / `error` / `canceled` | |
| `provisioning_jobs.status` | `queued → running → succeeded` / `failed` (retryable until `max_attempts`) / `canceled` | |
| `change_requests.status` | `draft → submitted → triaged → in_progress → delivered → closed` (+ `declined`) | Structure only in V1. |

Allowed transitions are encoded once in `lib/vigil/lifecycle.ts` and asserted
in unit tests; the database trigger records every change.

---

## 4. Roles, tenancy and RLS

### Roles

| Axis | Role | Can |
| --- | --- | --- |
| Organization | `owner` | Everything in the org: members, billing, settings, requests |
| Organization | `manager` | Operate: requests, website/domain views, invite members |
| Organization | `member` | Read the dashboard, create requests |
| Platform | `staff` | Read every tenant; operate websites, domains, subscriptions, jobs |
| Platform | `admin` | Staff + manage plans/features, grant staff, entitlement overrides |
| — | `service_role` | Webhooks, job runner, invitations — server only, never in the browser |

### Helper functions (`vigil` schema, `security definer`, `stable`, empty `search_path`)

- `vigil.is_staff()` / `vigil.is_admin()` — membership in `staff_members`
- `vigil.is_org_member(org_id)` / `vigil.org_role(org_id)` / `vigil.has_org_role(org_id, roles[])`
- `vigil.log_audit_event(...)` — the only way rows enter `audit_events`
- `vigil.accept_invites_for_current_user()` — called from the auth callback

### Policy pattern

Every tenant table has `org_id` (indexed) and:

- **select**: `vigil.is_staff() or vigil.is_org_member(org_id)`
- **insert/update/delete**: staff only for operational tables
  (`websites`, `deployments`, `domains`, `subscriptions`, `provisioning_jobs`,
  `provider_links`, `webhook_events`), org `owner`/`manager` for
  organization-facing writes (`organizations`, `organization_members`,
  `organization_invites`, `change_requests`, `virtue_settings`, notifications
  read-state).
- Catalog tables (`plans`, `plan_prices`, `features`, `plan_features`): read for
  any authenticated user, write for `admin` staff.
- `provider_links`, `webhook_events`, `staff_members`, `usage_records` (write):
  never readable by customers.
- `audit_events`: org members read their org's events; inserts only through
  `vigil.log_audit_event`.
- All policies wrap `auth.uid()` as `(select auth.uid())` so Postgres caches it
  per statement.

Every policy is exercised by `supabase/test/rls.test.sql` against the local
database with the auth shim, impersonating `anon`, `authenticated` users in
two different organizations, a staff user, and `service_role`.

---

## 5. Route map

### `app/(site)` — marketing (moved, not changed)

`/`, `/express`, `/process`, plus root metadata files that stay at `app/`.

### `app/(vigil)` — product

| Route | Who | Purpose |
| --- | --- | --- |
| `/login` | anyone | Email magic link |
| `/auth/confirm` | — | `token_hash` exchange (magic link) |
| `/auth/callback` | — | PKCE code exchange (OAuth-ready) |
| `/auth/signout` | signed in | Server action → `/login` |
| `/dashboard` | org member | Overview: website, domain, subscription, next step |
| `/dashboard/website` | org member | Website status, live URL, deployments summary |
| `/dashboard/domain` | org member | Domain status; guided connection placeholder |
| `/dashboard/billing` | org member | Plan, subscription status, entitlements |
| `/dashboard/requests` | entitlement `requests.enabled` | Structure only — list/create when enabled |
| `/dashboard/leads` | entitlement `leads.enabled` | Future stub |
| `/dashboard/insights` | entitlement `insights.enabled` | Future stub |
| `/dashboard/virtue` | entitlement `virtue.enabled` | Future stub |
| `/dashboard/settings` | org member (writes: owner/manager) | Business profile, members, invites |
| `/admin` | staff | Overview counters, failing jobs, attention list |
| `/admin/organizations`, `/admin/organizations/[orgId]` | staff | Customers, members, invites, subscriptions, websites |
| `/admin/websites`, `/admin/websites/[websiteId]` | staff | Lifecycle, deployments, domains |
| `/admin/subscriptions` | staff | Subscription states and entitlements |
| `/admin/domains` | staff | Domain states, verification, expiry |
| `/admin/requests` | staff | Change requests (structure only) |
| `/admin/jobs` | staff | Provisioning jobs, retries, errors |
| `/admin/audit` | staff | Audit log |
| `/admin/plans` | admin | Plan, price and feature configuration |
| `/api/jobs/run` | secret header / cron | Drain the provisioning queue |
| `/api/health` | anyone | Liveness (no data) |

### Code layout

```
lib/vigil/
  auth/session.ts        verifySession, requireUser, requireStaff, requireOrgContext (React cache)
  auth/errors.ts         typed errors mapped to redirects / forbidden()
  entitlements.ts        resolveEntitlements(orgId) and feature helpers
  lifecycle.ts           state machines + canTransition()
  audit.ts               logAuditEvent() wrapper
  jobs.ts                enqueueJob(), runDueJobs(), handlers registry
  providers/
    types.ts             BillingProvider, DeploymentProvider, DomainProvider interfaces
    registry.ts          getBillingProvider() etc. from env
    null/*.ts            in-memory / no-op implementations for dev and tests
    stripe|vercel|cloudflare/*.ts   named stubs that throw ProviderNotConfigured
  services/
    billing.ts, deployment.ts, domain.ts   provider-neutral orchestration
lib/supabase/
  server.ts, browser.ts, admin.ts (service role, server-only), proxy.ts
components/vigil/         shell, nav, status pills, empty states, tables
supabase/migrations/      numbered SQL
supabase/test/            auth shim + RLS assertions
types/database.types.ts   generated
```

---

## 6. Provider abstraction boundaries

```
Vigil Website      -> DeploymentService -> DeploymentProvider (vercel | null)
Vigil Domain       -> DomainService     -> DomainProvider     (cloudflare | null)
Vigil Subscription -> BillingService    -> BillingProvider    (stripe | null)
Vigil Account/Data -> Supabase (auth, RLS, storage)
```

Interfaces are deliberately small and return normalized results; nothing above
the adapter sees a provider object. Errors are `ProviderError` with a
`retryable` flag the job runner honours. Selection is by environment
(`BILLING_PROVIDER`, `DEPLOYMENT_PROVIDER`, `DOMAIN_PROVIDER`), defaulting to
`null` so the app boots with no credentials.

Deployment topology is now **one private GitHub repository and one dedicated
Vercel project per customer website**. `site/` is the Vercel project root;
provider ids stay in `provider_links`, while `websites.repository_ref` is the
human-readable `github:<owner>/<repo>` reference.

---

## 7. Immediate slice vs explicit stubs

**Implemented in this phase**

- Migrations 0001–0006, RLS, helper functions, audit trigger, generated types
- Magic-link auth, session DAL, proxy redirects, sign-out
- Client shell with Overview / Website / Domain / Billing / Settings reading
  real rows; Requests / Leads / Insights / Virtue routes that render a gated
  “not enabled” or “coming soon” state from entitlements
- Admin shell with Organizations (create, invite, view), Websites, Domains,
  Subscriptions, Jobs, Audit, Plans (edit feature values and prices — empty
  by default)
- Provider interfaces, null providers, named stubs, job runner and route
- Unit tests (vitest), SQL RLS tests, typecheck, lint, build

**Explicitly stubbed**

- Stripe checkout/webhooks, Vercel provisioning, Cloudflare registration
- Domain purchase flow and DNS verification (tables + status only)
- Change-request allowances, leads ingestion, insights, Virtue workflows
- Notifications delivery (table + unread count only)
- Usage/cost aggregation (table only)

---

## 8. Risks and open questions

1. **No live Supabase project.** The referenced project is gone. A new project
   must be created by the owner and linked (`npx supabase link`), then
   `npx supabase db push`. Until then the app boots against nothing.
2. **Staff bootstrap.** The first `staff_members` row must be inserted with the
   service role (SQL editor). Documented in `IMPLEMENTATION_LOG.md`.
3. **Express order → organization.** The leadgen Worker records Express orders
   in KV/SQLite. Bridging a paid order into `organizations` + `projects` is
   the checkout phase; a `projects.source_ref` column is reserved for it.
4. **Deployment topology, domain provider, pricing, allowances, offboarding**:
   all remain configurable placeholders per master architecture §15.
5. **`forbidden()`/`unauthorized()`** are experimental in Next 16; the DAL uses
   redirects and `notFound()` and keeps a single switch to adopt them later.
