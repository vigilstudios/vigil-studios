# Verification email release requirement

Inspection found production and the new preview using Supabase's built-in SMTP, with email auto-confirmation enabled. The built-in sender only delivers to organization team addresses, so it cannot support public customer registration. A paid Supabase plan does not remove that restriction.

The isolated preview now requires email confirmation, disallows unverified email sign-in, uses the branded scanner-safe confirmation/magic-link templates and restricts redirects to its exact app host. Fictional Auth acceptance creates links through the admin API without sending messages. Production Auth configuration has been backed up privately and is unchanged pending this connection/release decision.

The existing Resend send-only credential successfully authenticated to its SMTP server over verified TLS on port 465. This probe sent no message and did not store the credential in Supabase. Production delivery configuration and the single owner test remain pending approval.

## Concrete setup for approval

- Use the existing Vigil Resend account and existing send-only API credential. Its restricted permission was verified without reading email contents or sending a message. No new subscription or service plan is purchased.
- Store that credential only as the production Supabase Auth SMTP password. Host `smtp.resend.com`, TLS port `465`, username `resend`, sender `hello@vigilstudios.co`, display name `Vigil Studios`.
- Require email confirmation and reject unverified email sign-in before exposing free registration. Apply only SMTP fields, confirmation/magic-link subjects and contents, and these verification flags. Preserve provider settings, existing legitimate redirect allowlists, MFA, secure email-change and other protections. Do not copy the full local config over hosted settings.
- Keep application email keys blank in the isolated deployment. Keep preview Auth on its restricted built-in sender unless an owner-only test specifically needs a temporary connection. No client address is used for acceptance.
- With explicit send approval, deliver one verification/sign-in test to `hello@vigilstudios.co` to check the real template, sender and link. Do not send outreach, customer messages or booking communications during acceptance.
- Retain existing abuse controls and bounded email rate limits; do not increase provider spend or purchase higher quotas. Check successful SMTP authentication and hosted delivery before enabling public signup in production.

This gives Supabase Auth the ability to send Vigil authentication emails with an existing limited credential. Approval covers that specific credential destination and test recipient; it does not authorize marketing, arbitrary customer communication or a new paid plan.

References: [Supabase production SMTP requirements](https://supabase.com/docs/guides/auth/auth-smtp), [Resend SMTP settings](https://resend.com/docs/send-with-smtp), [Resend API key permissions](https://resend.com/docs/dashboard/api-keys/introduction).
