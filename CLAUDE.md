@AGENTS.md

## Express Sites

This site now sells the Express tier: `/express` is the catalogue, and
`PRICING_TIERS[0]` is Express Sites rather than the old Starter.

**Read `EXPRESS-STOREFRONT.md` before touching any of it.** The short version:
the template HTML and preview images in `public/express-templates/` are *copies*
from the sibling `vigil-leadgen` repo and go stale silently, the previews must
stay a uniform 900x1500 for the hover maths to hold, and `client_reference_id` on
the Stripe link is the only thing tying a payment to a template.

**The Stripe checkout link is deliberately empty** as of 28 Aug 2026 — nothing
catches a payment yet, so the catalogue routes to the contact form instead. Do not
restore it without the webhook and intake form.

## Vigil Dashboard V1

The product (login, client dashboard, admin) lives under `app/(vigil)`; the
marketing site is `app/(site)`. **Read `docs/dashboard-v1/ARCHITECTURE.md`
and `docs/dashboard-v1/IMPLEMENTATION_LOG.md` before touching it.** Schema is
`supabase/migrations/*.sql` (validate with `npm run db:validate`, regenerate
`types/database.types.ts` afterwards). Authorization is RLS plus
`lib/vigil/auth/session.ts`; `proxy.ts` only redirects. Provider ids live only
in `provider_links`. Plans, prices and entitlements are rows, never constants.
