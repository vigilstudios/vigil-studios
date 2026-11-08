# Google sign-in access plan

This is separate from the existing Calendar connector. No new Google sign-in client or live provider configuration has been created as of this plan.

| Setting | Proposed configuration |
| --- | --- |
| Google project | Existing `vigil-studios` project |
| Clients | Dedicated web clients for Vigil account sign-in, production and isolated preview separately |
| Production callback | `https://fotqwyfoqzjmcchwjpof.supabase.co/auth/v1/callback` |
| Preview callback | `https://eovwyctkveyvaerhqyeo.supabase.co/auth/v1/callback` — isolated `codex/account-access` branch |
| Requested access | OpenID, email and profile; basic name/email/photo only |
| Credential destination | Corresponding Supabase Auth Google provider settings, never client bundles or Calendar credentials |
| App switch | `VIGIL_GOOGLE_AUTH_ENABLED=true` only in an accepted environment |
| Redirects | Owned production and isolated-preview app hosts; preserve existing legitimate allowlists without adding a wildcard for unrelated Vercel projects |
| Privacy | Publish `/account-privacy`, retain the separate `/calendar-privacy`, and update/publish consent branding if required |

Keep PKCE, email confirmation, current MFA/organization protections and secure email-change settings. Do not request offline access, Gmail, contacts, phone access or Calendar scope for sign-in. Each customer chooses Google separately. Subscription eligibility does not connect anything. Existing automatic verified-identity linking must follow Supabase's provider security rules; no custom email-based membership claiming is added.

Acceptance uses fictional accounts and test-mode commerce in an isolated database. Check new and returning login, selected-package redirects, prospect permissions, staff/invitation destinations, sign-out, account binding, payment retry and cross-tenant refusal. A real Google test grant requires the owner's action-time approval if a consent prompt is presented. No client Google account is connected by testing.

Creating these OAuth credentials and enabling a new identity provider expands sign-in access. The browser confirmation policy requires explicit action-time approval for that concrete setup, separately from earlier Calendar approvals. Ask only once the exact preview callback and client form are ready. Never request passwords, codes or client secrets in chat. Store secrets directly in the appropriate server provider configuration and remove temporary local copies after verification.

Current references: [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google), [Auth configuration API](https://supabase.com/docs/reference/api/v1-update-auth-service-config), [email templates](https://supabase.com/docs/guides/auth/auth-email-templates).
