# Google sign-in access plan

This is separate from the existing Calendar connector. The owner approved this exact setup on November 8. Dedicated production and isolated-preview web clients have been created and stored in their matching Supabase Auth settings. The preview provider is enabled and accepted; production stays off until the account/privacy release and final checks. Do not request the same setup approval again.

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

The owner approved creating the credentials, storing them in the matching Supabase settings and enabling customer Google login after isolated acceptance and privacy/consent checks. This approval is separate from earlier Calendar approvals. Never request passwords, codes or client secrets in chat. Temporary local secret copies are private and must be removed after verification.

Google's Verification Center reports verified branding and no data-access verification requirement because the registered scopes are non-sensitive. Added only the basic profile scope alongside existing OpenID/email and the previously approved optional Calendar scope. The sign-in request explicitly uses `openid email profile` and `include_granted_scopes=false`; its real Google consent screen showed only name, profile picture and email. Existing Calendar clients/permissions are unchanged.

Isolated owner acceptance succeeded with `hello@vigilstudios.co`: one verified Google identity, a free prospect dashboard, no business membership, no staff role, and returning sign-in preserving the selected checkout package. No email was sent by this Google test. The branded public privacy URL is checked/published with the account release; the existing Calendar notice also links to the account notice and explains the separate sign-in permission.

Current references: [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google), [Auth configuration API](https://supabase.com/docs/reference/api/v1-update-auth-service-config), [email templates](https://supabase.com/docs/guides/auth/auth-email-templates).
