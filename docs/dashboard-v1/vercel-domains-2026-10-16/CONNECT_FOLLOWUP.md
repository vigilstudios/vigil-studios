# Connect follow-up and staff search repair — 16 October 2026

This slice repairs read-only discovery in Staff view and refreshes the required
connection feasibility gate. It does not implement or enable customer DNS work.

## User-visible correction

Staff viewing Scar's Domain page could see the journey heading and steps but no
search input. The shared component used the customer mutation permission for
discovery as well. Discovery now renders for authenticated tenant viewers,
including Staff view. Its server action still validates website tenancy and
enforces the shared fail-closed organization rate limit. Search uses Vercel's
public exact-name endpoint without any provider credential.

Only a real customer owner/manager may save, replace or cancel the choice. Staff
search results have no Continue action; viewing or searching does not create an
intent, purchase, domain, job or customer DNS consent. Saved choices remain
visible, and a viewer may search other names without replacing them.

## Automation gate

The refreshed [feasibility receipt](./FEASIBILITY.md) corrects the earlier omission
of classic Integration OAuth and records its documented DNS and registrar
permission overlap. A provider-supported application/grant and explicitly
authorized separate-account domain fixture are still missing. Connect stays
disabled. The original prompt requires this gate before the connection slice;
there is no fabricated callback, credential, provider fixture or success state.

## Fresh validation

- 2,381 tests / 118 files pass, including six staff-discovery UI/action and tenant
  isolation regressions; staff handoff/help/cancel remain forbidden before
  service-role access.
- Typecheck, full lint, production build and disposable migrations/RLS pass.
- No migration, generated type, customer source, launch or DNS change.
- Hosted Preview/browser/release receipts will be appended after verification.

Rollback uses the existing `DOMAIN_HANDOFF_ENABLED` switch or a code revert.
No new provider authorization or automatic-connection flag is introduced.
