# Accounts before purchase

Prepared on `codex/account-access` after restaurant reservations shipped in PR #51 and the website-widget cache correction in PR #52. Migration 67 is local/preview work until the release steps below are completed. Google sign-in is disabled by default pending its separate provider acceptance.

## Customer experience

Visitors can create a free account with a name, email and password, verify their email and enter a prospect dashboard. Overview, account settings and Get started / Express browsing are available without a purchase. Business tools remain visibly disabled; registration creates no organization, subscription, website or booking setup. Existing invited customers and staff retain their destinations.

Email/password and one-time email links remain supported. Optional Google sign-in requests basic identity only. Password forms use browser autofill semantics; password managers control saving. A non-secret session preference selects persistent or browser-session cookies, including subsequent browser/server token refreshes. Browser restore features can retain browser-session cookies; the preference is not a promise that closing a window revokes the server session. Sign out revokes the active session through Auth.

Selected packages survive authentication and email confirmation. The email carries a validated internal return path, so confirmation can resume in another browser. The branded confirmation page requires a button press before consuming its token, protecting against inbox link scanners. Tokens and passwords are never placed in account metadata or the admin directory.

Both checkout pages and the server action require a verified account. Submitted email fields cannot replace its identity. New orders bind to the Auth user ID. Prepared quotes require the matching buyer and valid token; business-bound quotes require owner membership before payment. After payment the account receives direct owner membership and onboarding access. Account-owned welcome emails contain a dashboard link rather than minting another sign-in credential.

## Ownership and isolation

Migration 67 adds immutable `orders.buyer_user_id`, a service-only quote-claim function, a narrow customer purchase projection and a staff-only account directory. Existing orders are not backfilled by matching email. Customer purchase rows exclude checkout tokens, metadata, provider payloads, errors and staff notes. Receipts and email resends check verified account ID or existing business membership before reading provider state or sending anything.

The existing atomic allocation RPC now handles all build kinds. Order and buyer/business locks serialize retries and competing purchases. A business is reused only when the exact buyer already owns it; matching billing email or business name alone cannot adopt private history. Legacy provider-backed purchases keep their compatibility path. One transaction creates the business, owner membership, project and website, with stable order references for replay.

## Admin experience

Customers now opens all registered customer/prospect profiles, excluding internal staff. Filters distinguish paid/provisioned purchases, no purchase, started checkout and live websites. Refunded orders have their own row status and do not count as paid purchases. Search uses literal name/email matching, with bounded pagination. Account detail shows businesses and purchase history. Existing organization management remains under Manage businesses. Contact by email opens the staff member's email application; development sends no outreach.

## Validation and release gates

- Production build, typecheck and complete local migration/RLS validation passed during development. Local real PostgreSQL concurrency proved one owned business for competing same-business purchases and stable identities on replay.
- Action tests cover anonymous/unverified refusal, forged email, invalid/expired/foreign quote rejection, trusted quote amounts and unauthorized email resend refusal. Auth tests cover destinations, scanner-safe email landing, cookie deletion/expiry, prospect navigation and autofill. Existing staff/customer login-routing fixtures were updated for the persistence cookie.
- Browser review covers desktop signup/prospect/admin views, paid/no-purchase filters, search, password visibility and the persistence checkbox; 390px signup and dark prospect views have no horizontal overflow. The loopback review uses fictional data and stubbed writes, not provider acceptance.
- The broad local suite encountered timeouts in existing CPU-heavy design-engine fixtures. Those failures must be resolved or pass CI before merging; do not represent this run as fully green.
- Remaining: final focused checks/lint, CI, isolated hosted RLS and real Auth/checkout acceptance, Google client/provider acceptance, production backups, migration 67, selected Auth-template changes and production smoke verification.

Before migration, back up production schema/data. Compare generated account types while preserving legacy definitions. Apply only the new migration and selected confirmation-template/redirect fields; do not blindly replace hosted Auth settings or existing preview allowlists. Keep email confirmation and existing security protections enabled. Release email accounts with Google hidden if Google is not yet accepted. Do not enable Google until its production provider, exact callbacks, consent/privacy pages and isolated acceptance pass. Keep test billing/deployment/email providers isolated from production credentials.

No new model infrastructure, paid communication provider, live client booking activation or automatic customer outreach is introduced. Existing subscriptions and client settings remain unchanged. Preserve historical worktrees and runtime bundles.

Evidence: [signup](evidence/signup-desktop-20261107.png), [prospect dashboard](evidence/prospect-dashboard-20261107.png), [admin accounts](evidence/admin-accounts-desktop-20261107.png), [phone signup](evidence/signup-mobile-20261107.png), [dark phone dashboard](evidence/prospect-mobile-dark-20261107.png).
