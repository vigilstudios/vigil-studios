# Supabase egress incident — October 8, 2026

## Evidence and cause

The organization reports 1,098.489 GB uncached egress against the 250 GB Pro
allowance for September 14–October 14. Supabase restricts the project with
HTTP 402 (`exceed_egress_quota`), including authentication. This explains the
production login failure.

Live Supabase usage breakdowns identify Storage as the dominant service:
October 4: 155.218 GB Storage versus 59.094 MB PostgREST; October 3:
145.88 GB Storage versus 59.684 MB PostgREST. These are daily breakdowns,
not a measured attribution of every byte in the billing period.

Gateway logs for October 4, 12:00–13:00 show one private original photo
requested 57 times. Fifty inspected requests all returned HTTP 200 with
different signed tokens, approximately 63 seconds apart. Tokens and customer
filenames are intentionally omitted here.

`LiveDashboardSync` refreshed the whole route every 60 seconds even with
healthy Realtime and in hidden tabs. Gallery server renders signed every
original again; changed image URLs downloaded the originals again. Its scope
object dependency also rebuilt the Realtime subscription after server refreshes.
Supabase documents separate CDN cache entries for separate signed tokens.
This combination explains the observed minute-by-minute photo traffic.

## Fix

- Realtime drives updates; the 60-second fallback refresh runs only when
  Realtime is unavailable and the browser is visible and online.
- Hidden-tab events are coalesced into one update on return. A disconnected
  subscription catches up on reconnect, including brief interruptions.
- Subscription dependencies use stable scope fields rather than object identity.
- Standalone and project Lab routes use manual refresh, preserving the editor
  draft and avoiding unrelated dashboard subscriptions and refreshes.
- Private image previews retain their loaded signed URL when the same object
  is re-signed. They renew near expiry or on a failed retained URL, and switch
  immediately for another object or transformation. Download/open links retain
  the newest server-provided URL. No public bucket or shared URL cache is added.
- Video tiles show an icon; media loads when the user opens it.
- Domain and deployment polling pauses in hidden or offline tabs.

Original images still transfer on first viewing, reopening a mounted gallery,
expiry renewal, or explicit downloads. This patch stops automatic repeated
downloads; it does not introduce generated thumbnails or guarantee zero egress.

## Validation

- Full working-checkout suite: 79 test files, 1,601 tests passed, including
  eight egress regressions covering signed URL reuse, expiry, object changes,
  healthy Realtime, hidden tabs, reconnect, fallback and editor routes.
- Isolated release candidate: 77 test files, 1,585 tests passed. Type checking,
  changed-file ESLint, and production build passed in both checkouts.
- Chrome fixture imports the actual `AssetPreviewImage`: 57 successive React
  prop updates with newly issued signed URLs produce one HTTP image request.
  Near-expiry renewal produces the second request; changing the object produces
  the third. The fixture server disables caching, so cache hits cannot mask a
  changed URL.
- Production build still reports the Supabase restriction. End-to-end live
  login and post-release traffic verification require service restoration.

## Release and billing

Prepared as a separate local release branch, `codex/fix-storage-egress`, so
the existing uncommitted Professional pipeline and design changes are not
included. This report does not claim production deployment. Publish/merge
requires the owner's authorization under `HANDOFF-CONTEXT.md` working rules.
Supabase billing settings remain unchanged.

The standalone Express composition editor persists its draft in localStorage;
editing and JSON export do not use Supabase Storage. Dashboard authorization
and navigation still make small Auth/database calls. Project-backed media and
file galleries use Storage. Usage already incurred cannot be reduced by a code
fix. At the documented $0.09/GB rate, the displayed 848.489 GB uncached excess
is approximately $76.36 before taxes/credits if it is billed; this is not an
invoice prediction. Ordinary API calls still count as egress, but the observed
PostgREST traffic was measured in MB per day rather than hundreds of GB.

Sources:

- https://supabase.com/docs/guides/platform/manage-your-usage/egress
- https://supabase.com/docs/guides/storage/cdn/smart-cdn#signed-urls-and-cdn-caching
