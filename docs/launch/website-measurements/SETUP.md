# Reporting activation and operations

Use only after the implementation is reviewed and the owner authorizes rollout. Development itself is already approved. Nothing in this checklist purchases a provider plan.

## Deploy safely

1. Review the diff and the [release report](RELEASE_20261102.md). Take the normal private application schema/data backup; verify deployed migration history through 59. Apply `20261102000060_website_measurements.sql` with the repository's Supabase workflow. Regenerate linked public/vigil types. The migration creates empty evidence tables, staff/service RPCs and structured stage-history details. It changes no existing site connection to enabled.
2. Deploy the reviewed application with `VIGIL_MEASUREMENTS_ENABLED=false`. Existing Lead Hub, Team, catalogue, onboarding and Content Hub flows remain covered by the full suite. Confirm Overview and Website analytics render safely with no reports; configure nothing on behalf of a client yet.
3. Supply server-only credentials using the hosting environment manager. Keep the global switch false while verifying resource mappings and provider access. Do not expose keys in a `NEXT_PUBLIC_` variable, provider-link metadata, client DTO, URL, screenshot or log. Use a separate read credential where the provider supports it. The existing Vercel team ID is an account routing setting, not a client-selected value.
4. Verify `CRON_SECRET` or the staff tooling `VIGIL_JOBS_SECRET` is set. Vercel's hourly analytics cron calls `/api/jobs/analytics`; the existing minute/daily provisioning crons remain intact. With a valid secret and the global flag false, the route returns `{enabled:false}` without database/provider work. A browser session or missing bearer is insufficient.
5. After authorized source setup for an initial site, enable the global flag, redeploy its environment and enable only that site's approved source rows in **Admin → Website → Reporting connections**. Request a refresh there; it schedules collection and does not run a provider request in the browser. A successful first measurement should appear after a cron cycle. Sources attempted in the last hour cannot be manually requeued repeatedly.

## Source requirements

| Source | Server configuration | Site authorization/configuration |
| --- | --- | --- |
| Traffic | `VERCEL_ANALYTICS_TOKEN`, optional fallback `VERCEL_TOKEN`; account `VERCEL_TEAM_ID` | Existing `provider_links` website/vercel/site mapping must point to the client's exclusive project. Verify Web Analytics enabled and a working deployed website tracking script. Confirm the client's collection permission/privacy requirements and accepted variable event costs before enrollment. |
| Mobile/desktop audits | Optional restricted `PAGESPEED_API_KEY` or `GOOGLE_METRICS_API_KEY` | Live public HTTPS canonical origin. Results cover its root page. Test both device strategies; a redirect to another origin needs a canonical mapping correction. |
| Real-user speed | `CRUX_API_KEY` or `GOOGLE_METRICS_API_KEY`, restricted to CrUX | Authorized public origin; sufficient eligible Chrome traffic. An insufficient-data result is a valid outcome for a new site. |
| HTTPS/headers | No provider key | Approved live public origin; DNS must resolve exclusively to public addresses and present a valid TLS certificate. Review header findings in the site's source/deployment separately. |
| Dependency alerts | `GITHUB_SECURITY_TOKEN`, fallback `GITHUB_TOKEN`; select only required repositories and Dependabot alerts read permission | Existing website/repository `provider_links` mapping with `metadata.full_name` in `owner/repository` form. Dependabot must be configured/available for that repository. A successful empty API result is needed before displaying zero open dependency alerts. |
| Search visibility | `GOOGLE_SEARCH_SERVICE_ACCOUNT_JSON` with a private service-account key; enable Search Console API | Grant that service-account email read access in the client's Search Console property. Enter exact `https://canonical-host/` or `sc-domain:canonical-host` in staff source setup. Parent domain access cannot be repurposed to query a sibling tenant. Use the canonical property that holds the client's data. |

Provider identifiers stay in `provider_links`. Do not add project/repository/property IDs to websites, settings JSON or public reports. All lookups use the selected website and organization. Do not map multiple clients into a shared traffic project: this API connector filters by project and production environment, not hostname. Alternate collectors such as GA4 need their own reviewed adapter and mapping; none is silently substituted here.

The traffic connector reads data; it does not enable project Web Analytics, deploy a tracking script or create a collector. Generated/static client sites need their own source-appropriate instrumentation and production redeployment after permission. Vigil dashboard instrumentation is not client traffic. Confirm actual collection in the provider console and check path redaction before enrollment; strip sensitive URL path segments/query values using the provider's supported instrumentation controls. The ingestion DTO strips query/fragment values from reported top paths, but cannot undo data already collected upstream.

## Acceptance for each site

- Confirm ownership and exact live canonical origin, project/repository/property bindings and read permission. Provider scopes must cover that site only where supported.
- Enable one source, run a bounded refresh, compare a real source period/total against its provider console and save the acceptance result privately. No fixture/synthetic values may be written as client evidence. Never interpret missing history as zero.
- Verify observed timestamp, expiry, coverage, device, timezone and period in client reporting. For traffic use API period counts, not daily sums; for Search Console use returned totals, not a sum of top queries. Daily trends use returned dates only; do not fill unreported or pre-collection days with zero.
- Test denied permission/disconnection and restored access on a test site. Last valid evidence must remain dated/flagged after a failed refresh; old revision results must disappear after disconnection/rebinding. Verify another tenant cannot read the report.
- Check staff runner health and quota/cost dashboards. A running heartbeat older than ten minutes or a start older than three hours is overdue; a recorded error needs attention. No heartbeat yet means execution has not been observed. No security feed may establish broader protection than its documented coverage.

## Cadence, retention and rollback

Traffic every six hours (12-hour freshness); lab audits every seven days (eight-day freshness); field speed, HTTPS, dependency and search daily (two-day freshness). A failed source retries after six hours. Each lease lasts four minutes; duplicate/stale/mismatched-origin commits are rejected. Two claims maximum per invocation, 150-second provider deadline, 180-second function allowance. If collection falls behind, review due times and observed load before increasing batch or cron frequency; this increases usage and needs budget review.

Evidence is pruned after 100 days based on stored creation time. It is derived analytics, not the retention policy for customer business records. Errors persist only a safe code, not raw provider text or tokens. Rebinding/disabling a source increments its revision and invalidates in-flight work. Historical snapshots remain available only under the tenant's RLS and are excluded from current reporting after revision changes.

To stop collection immediately set `VIGIL_MEASUREMENTS_ENABLED=false` and redeploy the environment. Disable individual sources in staff setup and revoke their upstream credentials/grants when required. **Stopping the reporting runner does not stop an upstream website tracking script or its collection charges.** To end traffic collection, disable it in the provider and remove the site instrumentation through the approved website release process. Use the provider's spending controls for account-wide protection.

Application rollback can leave the additive tables/data intact. Do not drop the new lead-event column or historical evidence during routine rollback. No rollback should remove customer leads or other business records.

## Local review

Use Node 24, `npm ci`, `npm run typecheck`, `npm run lint`, `npm test -- --maxWorkers=2`, `npm run build`, and the documented disposable PostgreSQL `npm run db:validate` workflow. Do not aim the SQL assertions at production. `node scripts/preview-measurements.mjs` serves fictional data on `127.0.0.1:4193`; `?theme=dark` and `?state=empty|stale|paused` exercise presentation states. It is a local Vite lab, not an authenticated production preview or an authorization bypass.
