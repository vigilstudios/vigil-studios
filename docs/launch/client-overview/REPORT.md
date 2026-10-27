# Live client overview

Local implementation on `codex/client-overview-redesign`. The authenticated preview is
http://127.0.0.1:3190/dashboard. The separate fictional-data design lab is
http://127.0.0.1:4188/ (`node scripts/preview-overview.mjs`). Nothing is deployed.
The preceding admin sign-in fix is preserved in local commit `a58b767`.

## Information hierarchy

1. **Website + trust:** the customer's actual website leads, with desktop/phone
   preview and content access. Alongside it, availability, domain and SSL checks
   show their recorded outcomes and timestamps. An unmeasured check stays pending;
   there is no invented uptime percentage, security score, speed score or SEO score.
2. **Conversations + action:** inquiry trends, current lead status and the oldest
   New inquiries form the working CRM summary. Incoming volume, the all-time New
   backlog and inquiries marked Won answer different questions. The inbox links
   straight to the existing lead detail workflow.
3. **Audience + direction:** traffic has Audience / Sources / Top pages views.
   The real application has no connected analytics read source, so it shows an
   explicit connection state, not a fictional graph or zero visitors. The lab
   demonstrates the ready-to-use chart interface with clearly labeled sample data.
   Insights remains Coming soon.
4. **Work + service:** a timestamped activity timeline switches to recent release
   history and recorded durations. Plan/renewal, open requests across the business,
   change options and role-gated source export sit below the business information.
   A mixed live/build account retains its onboarding navigation and a project link.

Time trends use area / bar / table views; lead status uses donut / ranked bars.
All share the same source values. Seven-, 30- and 90-day ranges apply to inquiry
and traffic reports, while the follow-up queue remains all-time and explicitly
oldest-first. Ninety-day trends use weekly buckets. Dates are explicitly UTC.
This is a view of current statuses for each arrival cohort, not a historical
conversion funnel or appointment synchronization. A New status is the proxy for
needing a first reply; external email sends do not update it automatically.

The visualization choices follow the distinction between trends, comparisons
and shares in [Datawrapper's chart guide](https://www.datawrapper.de/blog/chart-types-guide).
The focus on lead progress and actionable follow-up is informed by
[HubSpot's activities and lead reporting](https://knowledge.hubspot.com/reports/create-sales-reports-in-the-sales-analytics-suite).

## Personal layouts

Customize exposes native drag grips, keyboard/touch-friendly up/down buttons,
compact/wide/full desktop widths, panel visibility, reset, cancel and save.
Website and health remain visible. Small screens stack panels and adapt widths.
Chart choices can be saved with Save view. Failed saves keep the draft and show
an error. A live status message confirms movement and persistence.

Preferences are a versioned, allowlisted value in the signed-in user's Auth
metadata (`vigil_overview_layout_v1`), saved through a verified server action.
They merge only this non-sensitive key. Staff in Client view update their own
preferences, never the customer's. Unknown panels, invalid sizes, injected fields
and unsupported versions normalize safely. No role or access decision reads these
preferences; no schema migration is required.

## Data and access

`getOverviewLeads` uses the request-scoped RLS client, with both organization and
selected website filters on every inquiry/settings query. The selected website
must come from that organization's live website list. It paginates minimal
historical fields beyond Supabase's first-page limit and aggregates on the server;
the client receives chart buckets and at most five recent and five queued contacts.
No message bodies, private provider ids or credentials are sent in this read model.

History is bounded to 180 days and 10,000 records. If the bound is reached before
all matching rows are loaded, an explicit warning identifies incomplete period
charts and suppresses growth percentages. Exact inbox/backlog counts remain
complete. Higher-volume analytics should move to a scoped database aggregation
before this bound is expanded. Older health check dates remain visible.

Prelaunch-only accounts retain the existing onboarding/project overview. The
redesign does not change lead actions, review/launch gates, customer websites,
provider settings, subscription entitlements, or admin screen layouts.

## Validation

- Full suite: **2,654 tests / 137 files passed** with `npm test -- --maxWorkers=2`.
  The first unrestricted run hit two existing CPU-heavy Design Engine timeouts;
  the complete run with two workers passed without changing those tests.
- New coverage: UTC/cohort boundaries, spam exclusion, exact bucket totals,
  pagination, tenant/website isolation, capped history, empty/unconnected states,
  pending checks, preference normalization, personal saves and errors.
- Typecheck, full lint and optimized production build passed.
- Browser: authenticated customer overview rendered real site/lead data without
  console errors. The local sample verified area/bar/table switches, range totals,
  keyboard point navigation, donut/bars, actual drag reordering, arrow movement,
  resizing, hiding, save/reload persistence and recoverable save failures.
- Responsive checks used real app components inside 320/390/768px iframe viewports
  in the local lab because the in-app browser's viewport override had no effect.
  No document overflow was observed. Desktop and both themes were inspected.
  `?viewport=390&disconnected`, `?theme=dark&empty&disconnected` and `?fail`
  reproduce the key lab states. These fixtures are outside application routes.

Local data verification was read-only. Browser preference mutations used only
fictional lab storage; no real lead or customer data was changed.
