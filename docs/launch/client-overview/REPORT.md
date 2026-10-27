# Live client overview

Local implementation on `codex/client-overview-redesign`. The authenticated preview is
http://127.0.0.1:3190/dashboard. The separate fictional-data design lab is
http://127.0.0.1:4188/ (`node scripts/preview-overview.mjs`). Nothing is deployed.
The preceding admin sign-in fix is preserved in local commit `a58b767`.

## Information hierarchy

1. **Website + trust:** the website occupies two thirds of the first row, with
   the Vigil plan, renewal, requests and service actions inside the same card.
   Its proportionally scaled 1200×900 desktop preview is slightly larger and left
   aligned. The Live website eyebrow, linked domain and recorded availability,
   SSL and DNS checks sit to its right. Unmeasured checks stay pending.
   The right column has Vigil Security above a shared Site quality / Lead status
   row. Security monitoring and audit measurements have distinct connection states;
   passing SSL or DNS never implies a vulnerability scan or active firewall.
2. **Conversations + action:** inquiry trends, current lead status and the oldest
   New inquiries form the working CRM summary. Incoming volume, the all-time New
   backlog and inquiries marked Won answer different questions. The inbox links
   straight to the existing lead detail workflow.
3. **Audience + direction:** traffic has Audience / Sources / Top pages views.
   The real application has no connected analytics read source, so it shows an
   explicit connection state, not a fictional graph or zero visitors. The lab
   demonstrates the ready-to-use chart interface with clearly labeled sample data.
   Insights remains Coming soon.
4. **Work:** the final row has a three-quarter-width inbox and quarter-width
   recent activity panel. Swapping them expands activity to more events/full dates
   and simplifies the inbox to a three-contact list. Release history remains
   switchable. A mixed live/build account retains its onboarding navigation and a
   project link. Source export stays role-gated inside the website's plan section.

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

## Layout and styling

The approved desktop first-row height remains **616px**. Vigil Security takes
341px of the right column; Site quality and Lead status share the 263px lower
row, separated by a 12px gap. Website and status stack match exactly in both
Donut and Bars modes. The website preview fits proportionally beside its details
and above its plan, with a left-aligned desktop frame. Metadata fills the
remaining width with an 8px gap. Phone remains 390×780 and centers inside the
desktop preview area. Both the frame width/position and native iframe viewport
animate over 420ms; current dimensions keep scaling uniform without remounting
or reloading the page. Reduced motion disables these transitions. Below the
desktop breakpoint, the website uses its natural height; the two small status
cards remain side by side. Named `overview` container queries keep dashboard
breakpoints independent of the preview's size container.
The default second row is Insights / Website traffic / Inquiry trends. All
three have equal widths and share the same row height during swaps.
The final row's wide/narrow positions remain fixed while the swapped content
adapts. Reports swap only with reports; inbox and activity swap only with each
other. The first row, including the status stack, stays fixed. Tablet/phone widths
adapt into fewer columns. Existing v2 preferences retain report order, chart
choices and working slots while lead status and the new quality panel normalize
into the fixed status stack.

Headers have icons and direct drag grips, without an editing mode, Customize
button, visibility controls or resizing controls. Header/grip drag, keyboard
arrows and touch/pen grips swap positions. Swaps and chart choices save
automatically through a serialized queue. Failures preserve the local draft
and offer Retry save. A live status confirms persistence.

Readability uses larger 13–14px primary text, 11–12px supporting text, larger
chart labels and controls. Only the eyebrow remains above the cards. Trend
charts have no point markers; keyboard/hover values remain available. Donut
segments have flat ends and a near-background track. Lead status has a compact,
right-aligned view toggle and a larger ring with breathing room for its total
and singular/plural caption. Trend SVGs measure their actual containers so their
plots reach the right edge without letterboxing or stretched labels. Activity
has status-colored timeline dots; release rows use box icons. Card borders and fills
fade vertically, with opaque inner surfaces preventing dark-theme border bleed.
Insights uses the canonical Vigil green in this same gradient treatment.

The website's gradient uses the deployed site's brand accent. Modern sites
project one validated color from the immutable Design Engine snapshot preceding
the production deployment, after an RLS website access check. Older custom sites
fall back to public style tokens from their RLS-scoped, ready production Vercel
build: HTTPS on a single *.vercel.app hostname, no redirects or credentials,
2.5-second request deadlines, 256KB responses and at most two same-origin styles.
Only the resulting hex color reaches the client. No arbitrary customer URL,
external stylesheet host or script is fetched. Missing palettes remain neutral.
The actual Scar site resolves to its published pink token, #a52d60.

Preferences are versioned and allowlisted in the signed-in user's Auth metadata
(`vigil_overview_layout_v2`). Version 2 replaces the earlier widths/visibility
editor and normalizes ordering within the permitted rows. Verified server saves
merge only this non-sensitive key. Staff in Client view update their own
preferences, never the customer's. Unknown panels, injected fields and unsupported
versions normalize safely. No role or access decision reads these preferences;
no schema migration is required.

The shared authenticated frame is pinned to the viewport, with document scrolling
locked only while that frame exists. Its overflow is clipped rather than becoming
a second, focus-scrollable hidden container. Main content and navigation keep
their own scroll regions with scroll chaining contained. This fixes both scrolling
past the footer and controls moving the header/sidebar while receiving focus.
Public and frameless authentication pages retain their normal document flow.

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

## Monitoring and audit integration

Vigil Security uses an angular vigilante-eye header and a separate status shield.
A complete, current set of clear vulnerability, exploit, suspicious-activity and
firewall checks produces a blue vertical gradient and secured shield. Any flagged
check or unresolved alert produces an orange gradient and warning shield, with
Overview / Alerts controls and a bounded, scrollable alert list. Unconnected or
incomplete/expired monitoring stays neutral. Source-supplied observation/expiry
timestamps determine freshness. Unresolved alerts survive expiry; stale passing
firewall results never appear as Protected.

The real application currently passes **null security and audit reports**: there
is no connected threat/WAF monitor or website audit source in this repository.
No scan, firewall configuration, provider integration or scheduled background job
is added. The interface does not claim that continuous monitoring is active.
The fictional loopback lab demonstrates secured (`/`), orange alert (`/?alert`),
and unavailable (`/?disconnected`) states. Fixtures stay outside app routes.

Site quality shows recorded SEO and Performance scores out of 100 plus Speed as
Largest Contentful Paint in seconds, with device and audit timestamp. Missing or
invalid scores remain unmeasured; zero is a valid measured value. No speed score,
quality threshold or security metric is fabricated. Compact Lead status groups
are New / In progress (Contacted + Qualified + Booked) / Won / Lost. Both chart
views preserve the cohort total and link into the existing Lead Hub.

## Validation

- Full suite: **2,684 tests / 140 files passed** with `npm test -- --maxWorkers=2`.
  After the stale-check follow-up, **37 focused tests / 3 files passed**.
- Latest spacing/animation/scroll follow-up: **46 focused tests / 5 files passed**,
  plus typecheck, focused lint and optimized production build.
- New regressions cover current/expired/incomplete security states, retained
  alerts, absent monitoring despite passing SSL/DNS, unknown and zero audit
  scores, LCP units and compact CRM group totals. Existing tests preserve tenant
  scope, preferences, reporting, data truth and adaptive work panels.
- Browser: actual authenticated overview shows the larger left-aligned real
  preview with URL/checks to its right. Website and right stack both measure
  616px; security is 341px and both lower cards 263px. Phone preview is larger
  while preserving 390×780 proportions and staying above the plan.
- Latest browser checks verified the unchanged 477px desktop preview at a 992px
  dashboard width, an 8px metadata gap at expanded/rail widths, centered phone
  mode, the fixed-height status cards in their new order, a compact right-aligned
  toggle, padded donut text, activity dots and release boxes. Trend plot endpoints
  reach within 3px of the SVG edge; keyboard End still selects the final point.
  Repeated bottom scrolling and footer-control clicks keep root/frame scroll at
  zero with a 720px document/viewport and the header at y=0. Exact 320/390px inner
  viewport checks have no document or compact-card overflow. No new console errors.
- Fictional lab: blue secured state, orange alert state and alert details,
  both lead chart views at unchanged height, light/dark themes and
  320/390/768px viewport checks without horizontal overflow. Report/work panel
  swapping remains unchanged.

Local data verification was read-only. Preference mutations used only fictional
lab storage; no real lead or customer data was changed. Local servers remain on
3190 (application) and 4188 (sample lab). Nothing is pushed or deployed.
