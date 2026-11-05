# Account access phase — owner requirements, November 4

After booking calendar/design acceptance and release:
- Visitors can register before buying and enter a prospect dashboard, with unavailable sections visibly locked and a Get started / Find your package or website flow.
- An authenticated account is required before purchase. Checkout, orders, billing and provisioning must bind to that verified account, with no email-only claiming or duplicate organization creation on replay.
- Admin sees all registered customer/prospect accounts and can filter purchasers vs people who have not purchased. Include clear purchase/payment states; do not equate an incomplete checkout with a paid customer. Admin outreach tools require explicit send authorization; no messages are sent during development.
- Google login/signup alongside supported email sign-in. Support browser autofill/password managers and a secure persistent session choice. Browsers control password saving; Vigil must never store plaintext passwords or promise that a browser will save credentials automatically.
- Review existing auth, onboarding redirects, account/organization RLS and commerce flows before implementation; preserve deployed customer accounts and historical worktrees.

## Source audit and implementation order

The current login already supports passwords, one-time email links and Supabase sessions. Email links allow new Auth users, but dashboard navigation is empty without an organization and Overview requires an organization. Checkout is explicitly anonymous today. Admin Customers lists organizations, which excludes registered people who have not purchased. No Google sign-in button exists in the current login form.

1. Introduce a prospect Overview and locked navigation without manufacturing a website, subscription or paid organization. Keep profile/settings and the package finder accessible. Preserve invitations and staff destinations.
2. Add explicit registration and Google authentication, safe return destinations and verified account handling. Make password forms work with browser autofill; use the existing secure session machinery for returning customers. Review provider configuration and redirect allowlists separately before live activation.
3. Require authentication in both checkout pages and the server action, preserve selected template/plan across sign-in, and bind orders to the verified Auth user. Protect staff-issued checkout links from another signed-in account claiming them. Audit provisioning, webhook retries and legacy purchases before changing ownership; reconcile existing orders without an email-only account takeover path.
4. Add an admin account directory sourced from profiles plus purchase evidence. Filters: all, no purchase, paid/provisioning, active customer. Keep pending/cancelled/refunded payment states distinct. Profile access stays staff-authorized; prospect identities must never become visible across tenants.
5. Verify signup → prospect dashboard → selected package → authenticated payment → the same account's project/dashboard, including Google, password, email verification, invitation, duplicate webhook and existing-customer regressions in test mode.

This audit does not change authentication, checkout or production provider settings. Booking work remains its own release.
