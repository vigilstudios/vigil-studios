# Handoff context — Vigil Dashboard V1 → first customer

**Written:** 14 Sep 2026, mid-task. The previous session ran out of context.
**Read first:** `ARCHITECTURE.md`, `IMPLEMENTATION_LOG.md` (same folder), the
master product doc `../../../vigil-leadgen/VIGIL_STUDIOS_MASTER_ARCHITECTURE.md`,
and the repo `CLAUDE.md`.

---

## 1. Where things stand

Repo: `vigil-studios` (Next.js 16, Supabase, Tailwind 4). Everything is on
branch **`claude/dashboard-v1-foundation`** — 26 commits, **nothing merged to
`main`, nothing pushed**. `main` deploys `vigilstudios.co`; branches are
invisible in production. `origin/main` has not moved since the branch point,
so a fast-forward merge is possible.

Last commit `9549475` is an explicit **WIP** commit: it compiles (`tsc` clean)
but the checkout/Stripe/provisioning code in it has **never been run**.

### Done and verified live (against the real Supabase project)
- Supabase project `fotqwyfoqzjmcchwjpof` is linked (CLI token in keychain;
  `npx supabase@latest …` works from the repo). Migrations 0000–0008 applied.
  Project is on **Pro**; custom magic-link email template pushed (links land
  on `/auth/confirm`, work in any browser). Auth redirect allow-list uses
  wildcards for `www.vigilstudios.co`, `localhost:3000`, `127.0.0.1:3000`.
- Owner (`belierjav@gmail.com`) is the admin `staff_members` row.
- Test tenant **Marlow & Fen** exists in the live DB (owner keeps it as demo):
  org `b969475c-a62b-44d4-a929-e3d46995cf4f`, website
  `155dc9df-5a44-4e64-81c6-1e2830a45ef1`, domain `marlowandfen.test`, Growth
  subscription, two change requests (one with an attachment).
- App frame redesign (sidebar/rail/drawer), widgets, client Overview,
  Website page (standalone widgets, true-viewport preview, zip export),
  Requests with attachments (browser-direct upload to Storage), admin
  console incl. Orders page skeleton, Plans page with build prices + sync.
- "Sign in" link in the marketing navbar (`components/layout/Navigation.tsx`).
- Checks as of the last full run before WIP: 59 unit tests, 94 RLS
  assertions (`npm run check`), lint clean on new code, `next build` clean.
  **Re-run `npm run check` first thing** — the WIP commit added no tests.

### Local dev quirks
- Dev server: preview config `storefront-autoport` in
  `Websites/.claude/launch.json` (port 3000). Use `http://127.0.0.1:3000` —
  the owner's Chrome session cookie lives on that host (`allowedDevOrigins`
  is set for it). The Claude-in-Chrome extension is connected; its synthetic
  clicks are flaky on React buttons — `form_input` and JS `.click()` work.
- The owner's Chrome session was **signed out by accident** (a scripted
  click hit the sidebar sign-out form). They need to sign in again at
  `127.0.0.1:3000/login` before any browser verification.
- No Docker. `scripts/db-validate.sh` (`npm run db:validate`) applies the
  migrations plus `supabase/test/rls.test.sql` to a throwaway database on a
  local PostgreSQL at `postgres://postgres@127.0.0.1:54329/postgres`. That
  server was a scratch cluster and is probably gone; recreate it with:
  ```
  PG=/opt/homebrew/opt/postgresql@14/bin; D=/tmp/vigil-pg
  $PG/initdb -D $D -U postgres --auth=trust -E UTF8
  $PG/pg_ctl -D $D -o "-p 54329 -k '' -h 127.0.0.1" -l $D/pg.log start
  ```
  (There is also an EDB PostgreSQL 17 on port 5432 that needs a password —
  don't use it.) Types come from
  `npx supabase@latest gen types typescript --linked --schema public --schema vigil > types/database.types.ts`.

---

## 2. The task in flight: first customer, end-to-end

Owner's request (verbatim intent): first client signed (a cigar lounge
boutique; no Express template exists for it — that's fine, it's a custom
build). Needs: finalized subscription prices, Stripe payments with a
dedicated payment page (not a bare payment link), sign-in from the home
page (done), and an **extremely user-friendly, seamless** flow from "click
Buy on a template" → pay → guided onboarding → dashboard.

### Designed flow
1. **Buy** — catalogue "Buy" → `/checkout?template=<slug>` (plan picker,
   business name, email) → Stripe hosted Checkout (subscription mode: plan
   price + one-time build price). Staff-created orders use
   `/checkout/<token>` (prefilled, bound to the order's `checkout_token`).
2. **Provision** — `checkout.session.completed` webhook → `orders.status =
   paid` → job `order.provision` → organization, owner invite, project
   (`intake`), website (`provisioning`), subscription (from Stripe via
   `applySubscriptionSnapshot`, else a manual active row), welcome email with
   a server-minted sign-in link (`signInLinkFor` → `/auth/confirm?token_hash`).
3. **Onboard** — first sign-in → `/dashboard/onboarding` wizard (NOT BUILT).
4. **Operate** — billing portal link on `/dashboard/billing` (NOT BUILT).

### What the WIP commit contains (compiles, untested)
| File | Purpose |
| --- | --- |
| `supabase/migrations/20260914000008_commerce.sql` | `orders` (with `checkout_token`), `build_prices` (express $599, professional $1,499, custom NULL), `project_assets` + `project-assets` bucket, `projects.intake_completed_at`, anon read on plans/prices/features/build_prices, members may update `projects.brief`/`intake_completed_at` (other columns trigger-protected). **Pushed to remote.** |
| `lib/vigil/providers/types.ts` | Billing interface extended: `lineItems` (catalog or ad-hoc), `getCheckoutSession`, `ensurePrice`, richer `BillingEvent`. |
| `lib/vigil/providers/stripe.ts` | `StripeBillingProvider` (stripe@18, API `2025-08-27.basil`). Registry uses it when `BILLING_PROVIDER=stripe` **and** `STRIPE_SECRET_KEY` is set; otherwise the not-configured stub. |
| `lib/vigil/services/catalog.ts` | `syncCatalogToProvider` — creates/reuses provider prices by lookup key, records `provider_links` (`plan_price` / `build_price`). |
| `lib/vigil/services/orders.ts` | `startCheckout`, `completeCheckout`, `provisionOrder` (idempotent), `signInLinkFor`, `sendWelcome`. |
| `lib/vigil/email.ts` | Resend wrapper; dry-run logs when `RESEND_API_KEY` is unset. Env: `EMAIL_FROM`, `EMAIL_REPLY_TO`, `STAFF_NOTIFY_EMAIL`. |
| `lib/vigil/jobs.ts` | new job kind `order.provision`. |
| `app/api/webhooks/stripe/route.ts` | inbox in `webhook_events`, dispatch, inline `runDueJobs` after enqueue. |
| `lib/vigil/actions/checkout.ts` | `beginCheckout` (anon server action → `redirect(stripeUrl)`), `resendWelcome`. |
| `lib/vigil/queries/checkout.ts` | `getCheckoutCatalog` (plans purchasable only when price approved **and** synced). |
| `app/(vigil)/checkout/{page,[token]/page,success/page}.tsx` + `CheckoutForm`, `CheckoutShell`, `SuccessPanel` | The dedicated checkout pages. Success page self-heals if the webhook is late (checks the session directly). |
| `lib/vigil/actions/admin-orders.ts` | `createCheckoutLink` (with optional email), `markOrderPaidAndProvision`, `cancelOrder`, `syncPrices`, `updateBuildPrice`. |
| `app/(vigil)/admin/orders/*` | Orders list + "Send a checkout link" form; nav item added. |
| `app/(vigil)/admin/plans/page.tsx` | Build prices table, provider price ids, "Sync prices" button. |

### Not built yet (in priority order)
1. **Onboarding wizard** `/dashboard/onboarding` — steps: business basics
   (tagline, phone, email, address, hours) → services/menu (repeatable) →
   about/story → brand & photos (upload to `project-assets` bucket via
   browser, rows in `project_assets`, kinds logo/photo/document) → domain
   ("I have one" → hostname / "I need one" → desired names) → review &
   submit. Save to `projects.brief` jsonb as they go (server action; RLS
   allows members to update `brief` and `intake_completed_at`). On submit:
   set `intake_completed_at`, staff moves project `intake → in_progress`
   (or do it via a staff-only action), email staff (`sendEmail`), audit.
   Post-login: if the org's active project is `intake` with no
   `intake_completed_at`, redirect `/dashboard` → `/dashboard/onboarding`;
   Overview shows a "Finish onboarding" CTA otherwise.
2. **Catalogue Buy button** — `components/express/ExpressCatalogue.tsx`
   (Codex-owned; make the minimal edit, flag it): change the "Enquire" link
   (`href="/#contact"`, class `styles.enquire`) to
   `href={`/checkout?template=${active.slug}`}` labelled `Buy · $599`.
   `lib/constants.ts` `EXPRESS_CHECKOUT_URL` can stay `""`.
3. **Billing portal** — `/dashboard/billing` "Manage billing" → server action
   → `getBillingProvider().createPortalSession(customerExternalId, returnUrl)`
   using the org's `provider_links` customer (`resource_kind='customer'`,
   `entity_type='organization'`), then `redirect(url)`.
4. **Admin org detail**: show orders for the org; nothing else needed.
5. **Tests**: unit tests for `startCheckout` / `provisionOrder` with the
   `FakeAdmin` in `lib/vigil/__tests__/fake-admin.ts` (extend it for
   `.in()`, `.is()`, `.rpc('log_audit_event')`), and for the Stripe
   normalizers (`toSubscription`/`toCheckout` are module-private; export or
   test through `parseWebhook` with a constructed event + `stripe.webhooks
   .generateTestHeaderString`).
6. **End-to-end test in Stripe test mode**, then live. Then merge to `main`.
7. Docs: `IMPLEMENTATION_LOG.md` entry for all of the above; `.env.example`
   needs `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_TAX`,
   `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `STAFF_NOTIFY_EMAIL`,
   `NEXT_PUBLIC_TERMS_URL`, `NEXT_PUBLIC_REFUND_NOTE`.

### Known gaps / risks in the WIP code (check these when testing)
- `provisionOrder` step 4 links the Stripe price to the order's plan price
  by assuming the `month` interval; fine for now (only monthly exists).
- `startCheckout` requires the plan's monthly price to be **approved (not
  NULL) and synced** — until the owner sets prices and clicks "Sync prices",
  `/checkout` shows "Online checkout is not switched on yet".
- `getCheckoutCatalog` uses the service-role client to read `provider_links`
  (anon can't). It returns all plans as non-purchasable when
  `SUPABASE_SECRET_KEY` is unset.
- The Stripe webhook is POST at `/api/webhooks/stripe`; needs the signing
  secret. In Stripe Dashboard → Webhooks add the production URL
  `https://www.vigilstudios.co/api/webhooks/stripe` with events:
  `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `customer.subscription.created|updated|deleted`, `invoice.paid`,
  `invoice.payment_failed`. Local testing: `stripe listen --forward-to
  127.0.0.1:3000/api/webhooks/stripe` (Stripe CLI) — the owner runs it.
- `signInLinkFor` tries `generateLink({type:'magiclink'})` then falls back to
  `invite` for unknown emails; **unverified** against the real Auth API.
- The leadgen Cloudflare Worker still has its own Stripe webhook for the
  old payment link; harmless, but Stripe sends events to every endpoint.
- Vercel body limit (4.5 MB): attachments already upload browser-direct;
  the onboarding photo uploads must do the same (bucket `project-assets`,
  path `<org>/<project>/<uuid>.<ext>`, `validateAttachments`-style checks).

### Backlog (owner request, 14 Sep): friends-and-family flexibility

Two admin capabilities, both per-customer, both without pushing the customer
to a higher tier:

1. **Customer-specific discounts.** Design: Stripe coupons / promotion codes
   are the source of truth for money; Vigil records the intent.
   - `orders.discount` (jsonb or columns: `coupon_ref`, `percent_off`,
     `amount_off_cents`, `reason`) set by staff on the "Send a checkout link"
     form; `startCheckout` passes it to the provider (`discounts: [{coupon}]`
     on the Checkout Session, or `allow_promotion_codes: true` for a code the
     customer types). Extend `BillingCheckoutInput` with `discountExternalId`.
   - Recurring discounts live on the Stripe subscription (coupon with
     `duration`); the dashboard's billing page just shows the resulting
     price from the snapshot. An admin "Apply discount" action on the
     organization (provider `customers.update` / subscription coupon) can
     come later — for the first cases, set it in the Stripe Dashboard.
   - Audit every discount (`order.discount_applied`, who and why).

2. **Custom scope on an Express site without upselling.** Two layers:
   - *Platform features:* `entitlement_overrides` already does this — grant
     `requests.enabled`, a bigger allowance, `virtue.enabled`, etc. to one
     organization with a reason, no plan change. Admin UI exists on the
     customer page (admin role). Just use it.
   - *Site scope:* add a free-text-plus-checklist "scope" on the project
     (`projects.brief.scope` or a `projects.scope` jsonb): extra sections,
     integrations, custom components agreed for this build, plus an optional
     `custom_build_addon_cents` on the order (already supported as the
     ad-hoc build amount on staff-created links; a $0 add-on is fine). Show
     it on the admin project view and in the client's project card so the
     agreement is visible to both sides. No new plan, no new tier.

Neither needs a migration beyond a nullable jsonb column; keep the money in
Stripe and the intent in Vigil.

---

## 3. Still needed from the owner (asked, not yet answered)

1. Monthly prices for Basic / Care / Growth / Priority (enter on
   `/admin/plans`, then "Sync prices"); confirm $599 / $1,499 one-time.
2. Care change-request allowance (`requests.monthly_allowance`).
3. The cigar-lounge client: business name, contact email, chosen plan,
   quoted build amount → create the order on `/admin/orders` ("Send a
   checkout link", kind = custom).
4. Whether they own a domain.
5. Terms/service-agreement URL (`NEXT_PUBLIC_TERMS_URL`) and a refund line.
6. Stripe Tax on/off (`STRIPE_TAX=true|false`).
7. Credentials the owner pastes (never handle them): `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, plus Vercel env vars
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
   `NEXT_PUBLIC_APP_URL=https://www.vigilstudios.co`, `SUPABASE_SECRET_KEY`,
   `VIGIL_JOBS_SECRET`, `BILLING_PROVIDER=stripe`.
8. Sign in again in Chrome for browser verification.

---

## 4. Working rules that applied (keep them)

- The Express catalogue (`components/express/*`, `public/express-templates/*`,
  `lib/express-accents.json`) and the `vigil-leadgen` repo are Codex's; the
  previous (Claude) session avoided them. If you are Codex, they are yours —
  the Buy-button change and anything else there is fine.
- Prices, allowances, provider choices are rows / env, never constants.
- Status is always icon + label + colour. Widgets show real rows only.
- Verify in a real browser (screenshots and green tests both hid bugs).
- Commit per stage on the branch; do not push or merge without the owner.
- Commit trailers: the previous session used `Co-Authored-By: Claude Opus 5`;
  use whatever attribution your tooling prescribes.
