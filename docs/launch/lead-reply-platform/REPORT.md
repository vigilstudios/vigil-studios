# Lead Hub reply platform — 2026-10-22

Follow-up: Gmail now uses the connected draft flow described in [GMAIL_CONNECTION.md](GMAIL_CONNECTION.md). The sections below record the original 22 October release.

A personal setting selects Default email app, Gmail, Outlook.com, or Microsoft 365 Outlook. The default preserves the existing mailto behavior until the user chooses another platform. A separate panel in Lead Hub Settings is available to every signed-in user, independent of the owner/manager restriction on website notification preferences. Staff viewing a customer saves only the signed-in staff account’s preference.

The authenticated server action validates the platform and calls the session-scoped Supabase Auth updateUser with only data.lead_reply_platform. Existing Auth metadata is merged by Auth; no service-role mutation, arbitrary user id, table/schema migration, mailbox credential, or OAuth grant is involved. Server pages read the verified session user’s metadata and allowlist it before rendering.

Each inquiry’s Reply button opens a new addressed draft with subject “Re: Your website inquiry”. Gmail and the two Outlook account types use fixed HTTPS compose destinations in an isolated new tab; the default app uses mailto. Address encoding preserves plus aliases and rejects additional recipients and header injection. The original message remains in Lead Hub; no visitor message is put into a third-party URL. Check the sending account before sending. External conversations, threading, and sent status are managed by the mail platform.

## Validation

- 41 added tests cover valid/invalid metadata, authenticated persistence, member access to their personal choice, ignored forged user/role fields, failure/no-success behavior, provider destinations, encoded recipients, malformed addresses, default app fallback, settings selection, inquiry CTA and safe new-tab attributes. Existing 17 Lead Hub tests also pass.
- Full suite: 129 files, 2,559 tests passed. TypeScript, focused ESLint, production build, and diff whitespace validation passed.
- Browser lab: choose Gmail, save, reload, return to inbox, open a sample inquiry; CTA is Reply in Gmail with its correct example.com contact. Simulated failed saves show inline feedback and leave the previously saved preference intact after reload. Lab storage is session-only and contains no live contact data. At a verified 390px viewport, dark and light settings layouts have no horizontal document overflow; the temporary viewport override was reset.
- No email was sent and no production inquiry was created. Compose links are not an email sending integration; a signed-in provider compose session and actual delivery are not claimed by automated tests.

## Release

Release target: the shared Vigil application on main. This does not redeploy Scar’s public website or her local promo preview. Post-deploy verification is recorded in the task’s final response.
