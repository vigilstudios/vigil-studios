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
