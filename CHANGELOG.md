# Changelog

## Dashboard V1 foundation

The Vigil platform now has its own root layout (`app/(vigil)`) beside the marketing site (`app/(site)`, moved verbatim): magic-link sign-in at `/login`, the client dashboard at `/dashboard` (Overview, Website, Domain, Subscription, Requests, Settings; Leads, Insights and Virtue gated by entitlements) and the staff console at `/admin` (customers, websites, domains, subscriptions, requests, jobs, audit log, plan and entitlement configuration). Six migrations under `supabase/migrations` define organizations, memberships, staff, the plan catalog and entitlements, projects, websites, domains, deployments, provider links, audit events, provisioning jobs, the webhook inbox, notifications and the future-facing requests, leads and Virtue tables, all with row-level security. Billing, deployment and domain providers are interfaces with in-memory adapters; no prices, allowances or provider credentials are hard-coded.

`middleware.ts` is now `proxy.ts`. The dev-only `/admin`, `/client-portal` and `/supabase-test` stubs that read a database that no longer exists were removed. The referenced Supabase project is gone; a new one must be created and linked before the dashboard can be used (see `docs/dashboard-v1/IMPLEMENTATION_LOG.md`).

Validation: `npm run check` (typecheck, 47 unit tests, migrations plus 70 RLS assertions against a local PostgreSQL), ESLint on the new code, Next.js production build, and browser checks that the marketing pages and Express catalogue render unchanged.

## Express preview clipping and content entrances

Preview browser and viewport wrappers use non-scrolling clipping so navigation inside scaled template iframes cannot shift or crop the fixed navbar. Both published templates retain sequential heading words and restore their original content fades and slides. Auto Repair also uses explicit fixed-header anchor offsets. Browser regression coverage lives in `vigil-leadgen/tests/browser/express_motion_navigation.js` and must be run for future template navigation or motion changes.

## Express catalogue motion and navigation fix

The Auto Repair catalogue HTML has been regenerated from `auto-repair/v1`, publishing the sequential word-by-word hero animation that was already present in the renderer. The Restaurant catalogue HTML now uses deterministic fixed-header section navigation on desktop and mobile, so selecting a navbar option no longer delays the scroll or leaves the page at the previous section.

## Restaurant and Cafe V1

The Restaurant and Cafe catalogue entry now serves the approved Marlow & Fen design, including its mobile layout, animated daypart menu, gallery, reviews and booking demonstration. The entry accent and description match the new template. The catalogue retains its existing industry order, carousel controls and viewport selector behavior.

The generated HTML comes from the canonical renderer in `vigil-leadgen`, template ID `restaurant/v1`. No parallel client schema or storefront-specific styling layer was introduced. Source generation and schema/token inheritance are documented in that repository's `docs/restaurant-v1.md`.

Validation: Next.js production build and browser inspection of desktop/mobile catalogue previews.
