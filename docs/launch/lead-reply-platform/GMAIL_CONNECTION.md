# Gmail full-inbox draft handoff — 23 October 2026

The existing view=cm/fs=1 link opens Gmail’s standalone composer. Current Google compose/handler routes were reproduced in Chrome; removing fs or using tf=cm still opens a standalone page. Lead Hub now has an authenticated Gmail draft flow instead.

## Behavior

- Personal Connect / Reconnect / Disconnect controls live in Lead Hub Settings, alongside the existing saved platform preference. Google credentials and access belong to the signed-in user, including staff viewing a customer.
- A same-origin authenticated POST starts OAuth using a short-lived HTTP-only host cookie, random state, PKCE, and a fixed configured callback. The callback binds to the same application user, validates granted scope and the verified Google mailbox, then saves the refresh credential in private Vault storage.
- A native same-origin POST in a new tab prepares the reply. The server resolves the lead under the current organization before reading mailbox credentials. The recipient is validated; an RFC MIME body quotes the entire original inquiry beneath blank reply space. The Google request creates a draft only. No sending, inbox ingestion, external thread synchronization, or automatic lead-status change is implemented.
- The resulting Gmail URL selects the connected account and opens its saved draft thread inside the full Gmail interface. Existing drafts are reused without overwriting edits. A database lease blocks parallel attempts, and credential-version checks prevent caching a result after disconnect or reconnect. Google create requests are not automatically retried after uncertain failures; error guidance tells users to check Gmail Drafts first.
- Provider draft/thread identifiers stay in provider_links. Refresh credentials and references are inaccessible to customer and anonymous database roles. Disconnect revokes the Google grant and removes active connection credentials and associations; user deletion also cleans the Vault reference. Gmail drafts remain the user’s own data and are not deleted by Vigil.
- Missing platform credentials disable connection initiation. A user can still reply through their default email app while setup is pending. Privacy disclosure is /gmail-privacy.

## Platform setup required

The Google Cloud console currently selects project vigil-studios but the signed-in account cannot create OAuth clients. No Google credentials or mailbox grants were created by this task. An authorized project owner must complete this setup:

1. Enable Gmail API. Configure Google Auth Platform branding/audience and the applicable consent review. App homepage: https://www.vigilstudios.co/ ; privacy: https://www.vigilstudios.co/gmail-privacy . Use named test users only while the app is in Testing.
2. Create an OAuth client of type Web application with exact authorized redirect URI https://www.vigilstudios.co/api/gmail/callback .
3. Configure only openid, email and https://www.googleapis.com/auth/gmail.compose . Google classifies gmail.compose as restricted; the public application must complete the applicable verification/security assessment before broad production access.
4. Save GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET and GMAIL_REDIRECT_URI in server-side production environment variables. Never use NEXT_PUBLIC or paste the client secret into chat. Redeploy after configuring them.
5. Each user opens Lead Hub Settings, connects their own Google mailbox, reviews and grants consent themselves, selects Gmail as the reply platform, and saves. A real OAuth → API-created draft → Gmail handoff still needs this account-owner verification.

Sources: https://developers.google.com/identity/protocols/oauth2/web-server ; https://developers.google.com/workspace/gmail/api/guides/drafts ; https://developers.google.com/workspace/gmail/api/auth/scopes ; https://developers.google.com/workspace/gmail/imap/imap-extensions .

## Validation and limits

- Full application suite: 132 files / 2,601 tests passed. Focused OAuth, provider, tenant-bound draft preparation, route-CSRF and UI tests passed; TypeScript, focused ESLint, and optimized production build passed.
- Local migration/RLS suite passed, including 21 Gmail assertions for private credentials, per-user access, masked status reads, lease contention, stale release, disconnected results, provider associations, disconnect cleanup and user deletion cleanup. The local Vault shim tests access/transactions rather than cryptography.
- Migration 20261023000050 was applied to the linked production database; database types were regenerated from that project. It adds private dormant storage/RPCs and no mailbox grants.
- Chrome verified the exact full-Gmail #drafts/thread-id handoff using a clearly labeled synthetic example.com draft, with inbox/sidebar/search and original quoted sample context visible together. This draft was prepared manually for URL verification, not through the unconfigured OAuth integration. It remains unsent and open for review. No visitor was emailed.
- The local UI lab at http://127.0.0.1:4187/?view=settings simulates account connection and draft preparation with sample data; it never contacts Google.
- Actual Google OAuth token exchange and draft API behavior are tested with controlled HTTP responses. Real end-to-end connection is blocked by missing OAuth-client configuration and project permissions. No physical iOS validation is claimed.

Application release/activation identity is recorded in the task’s final response.
