# Accounts before purchase

Prepared in PR #53 on `codex/account-access` after restaurant reservations shipped in PR #51 and the website-widget cache correction in PR #52. Migration 67 was applied to production after fresh private schema/data backups. Follow-up migration 68 explicitly removes hosted default write grants from the customer purchase projection. Production account screens and Google activation follow the checked release steps below; Google remains disabled by default until provider acceptance.

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
- Both full CI runs passed, including the CPU-heavy design-engine fixtures that timed out locally. Auth/commerce checks include 89 focused tests with explicit Google-scope/activation checks and legacy provider-identity regressions, plus repeated hosted/local account SQL checks.
- Isolated hosted acceptance passed for confirmation-required signup (link generation without mail), refusal of unverified password sign-in, anonymous checkout → signup, scanner-safe confirmation → the selected package, the prospect dashboard, saving a profile name and sign-out. A simulated paid fixture provisioned exactly one business, exact buyer-owner membership, project and website; the same account opened onboarding. This was not a Stripe payment test. No message or external repository/deployment was created.
- A separately confirmed fictional customer received Not found when opening the buyer's receipt. A fictional staff reviewer saw both purchaser/prospect profiles, correct filters, account details and the exact admin order. The test staff row exists only in the isolated preview.
- Hosted previews lacked historical production table grants. Compared production and preview catalog privileges, then restored only existing production SELECT/INSERT/UPDATE/DELETE grants on public tables with RLS enabled in both environments. RLS was retained and no production ACL changed. Transactional RLS fixtures rolled back; the three explicitly fictional review identities remain isolated.
- Legacy purchases retain business identity from the verified provider customer reference; account-bound purchases ignore another business's provider mapping. An unallocated legacy session waits/retries if its provider identity cannot be verified instead of creating a duplicate business. Existing owners of legacy paid businesses appear under Purchased.
- The owner approved both access plans. Real Google preview sign-in and return-to-package acceptance passed; production Resend SMTP/required verification and the single owner email acceptance are complete. Migration 67 was applied after private production schema/data backups. Remaining: account/privacy code rollout, final Google consent/privacy publication and production smoke verification.

Before migration, back up production schema/data. Compare generated account types while preserving legacy definitions. Inspection found production email auto-confirmation enabled and no custom SMTP. Public signup therefore requires the verification/delivery correction in `AUTH_EMAIL_ACCESS_20261108.md` before release. Apply only the new migration and selected Auth fields; do not blindly replace hosted Auth settings or existing preview allowlists. Preserve existing accounts and security protections. Keep Google hidden until its production provider, exact callbacks, consent/privacy pages and isolated acceptance pass. Keep test billing/deployment/application-email providers isolated from production credentials.

No new model infrastructure, paid communication provider, live client booking activation or automatic customer outreach is introduced. Existing subscriptions and client settings remain unchanged. Preserve historical worktrees and runtime bundles.

Evidence: [signup](evidence/signup-desktop-20261107.png), [prospect dashboard](evidence/prospect-dashboard-20261107.png), [admin accounts](evidence/admin-accounts-desktop-20261107.png), [phone signup](evidence/signup-mobile-20261107.png), [dark phone dashboard](evidence/prospect-mobile-dark-20261107.png).

Hosted evidence: [prospect](evidence/hosted-prospect-20261108.png), [owned onboarding](evidence/hosted-owned-onboarding-20261108.png), [receipt refusal](evidence/hosted-receipt-denied-20261108.png), [account directory](evidence/hosted-admin-accounts-20261108.png), [account detail](evidence/hosted-account-detail-20261108.png). Review branch: `https://vigil-studios-git-codex-account-access-vigilstudio-projects.vercel.app`.

The production permission audit found default DML grants on the new purchase view. Migration 68 revokes all defaults and grants SELECT only to authenticated users. The full local migration/RLS/concurrency suite passes with an explicit hosted-default privilege assertion; no historical order is reassigned.
