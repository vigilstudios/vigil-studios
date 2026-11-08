# Verification email release requirement

Inspection found production and the new preview using Supabase's built-in SMTP, with email auto-confirmation enabled. The built-in sender only delivers to organization team addresses, so it cannot support public customer registration. A paid Supabase plan does not remove that restriction.

The isolated preview requires email confirmation, disallows unverified email sign-in, uses the branded scanner-safe confirmation/magic-link templates and restricts redirects to its exact app host. Fictional Auth acceptance creates links through the admin API without sending messages. The owner approved the exact production delivery setup and one test to `hello@vigilstudios.co` on November 8; do not request that approval again.

Production now uses the existing Resend send-only credential in Supabase Auth SMTP over TLS on port 465, with required email confirmation and unverified email sign-in disabled. The branded templates were read back and verified. Existing CAPTCHA, session, SMS, secure-email-change and other provider settings were preserved; no subscription was purchased. The email cap is 20/hour, with 60 seconds between repeated sends to a recipient.

The single approved sign-in/verification test arrived in the owner's inbox from Vigil Studios, linked directly to the production confirmation page, waited for Continue, and opened the existing account. `shouldCreateUser=false` prevented creating another account. No customer, outreach or booking email was sent. Private delivery evidence remains outside the repository. Do not repeat the send without fresh authorization; the approved one-message test is complete.

## Approved setup

- Use the existing Vigil Resend account and existing send-only API credential. Its restricted permission was verified without reading email contents or sending a message. No new subscription or service plan is purchased.
- Store that credential only as the production Supabase Auth SMTP password. Host `smtp.resend.com`, TLS port `465`, username `resend`, sender `hello@vigilstudios.co`, display name `Vigil Studios`.
- Require email confirmation and reject unverified email sign-in before exposing free registration. Apply only SMTP fields, confirmation/magic-link subjects and contents, and these verification flags. Preserve provider settings, existing legitimate redirect allowlists, MFA, secure email-change and other protections. Do not copy the full local config over hosted settings.
- Keep application email keys blank in the isolated deployment. Keep preview Auth on its restricted built-in sender unless an owner-only test specifically needs a temporary connection. No client address is used for acceptance.
- With explicit send approval, deliver one verification/sign-in test to `hello@vigilstudios.co` to check the real template, sender and link. Do not send outreach, customer messages or booking communications during acceptance.
- Retain existing abuse controls and bounded email rate limits; do not increase provider spend or purchase higher quotas. Check successful SMTP authentication and hosted delivery before enabling public signup in production.

This gives Supabase Auth the ability to send Vigil authentication emails with an existing limited credential. Approval covers that specific credential destination and test recipient; it does not authorize marketing, arbitrary customer communication or a new paid plan.

References: [Supabase production SMTP requirements](https://supabase.com/docs/guides/auth/auth-smtp), [Resend SMTP settings](https://resend.com/docs/send-with-smtp), [Resend API key permissions](https://resend.com/docs/dashboard/api-keys/introduction).
