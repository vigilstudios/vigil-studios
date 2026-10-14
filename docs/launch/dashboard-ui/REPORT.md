# Dashboard UI revision — 2026-10-14

Content Hub now uses the dashboard's theme tokens and full available width. Collection controls, cards, media placeholders and dialog fields share the established surface, border, typography and accent colors. The upgrade wall is centered and uses a Lucide crown instead of an emoji. Blog's heading is “Blog posts,” with the site still correctly scoped behind the scenes. Content Hub and Lead Hub show crown indicators in expanded and collapsed navigation.

The shared SiteFrame resizes its browser container to a maximum of 390 px in phone mode. Browser width and viewport height transition over 360 ms; reduced-motion preferences disable these transitions. The embedded site still receives its real 1200/390 px viewport.

“Website” is now “Website Preview.” Navigation disappears when every registered website has both live status and a live address. Direct visits then redirect to Overview. Organizations with another website awaiting launch retain previews for that website. Live-site code exports, address, change requests, last production publish, health checks and domain/certificate tools are available in Overview for every live website, with existing role checks intact.

Overview includes a donut chart of recorded availability/DNS/SSL checks and a segmented release-outcome chart. Charts have textual values and accessible summaries. SSL is derived from the domain's recorded ssl_ok value, never inferred from launch. Unmeasured checks remain unknown. Preview releases do not count as production successes or “last published.”

## Data limitation

Traffic, performance and SEO reporting have no connected customer read-side data source in the current repository. Their Overview panels explicitly show “Not connected”; no visitor counts, speed scores, SEO scores or trends are fabricated. Connecting those sources is a separate remaining reporting implementation. Lead capture eligibility is unchanged: the requested crown does not add a new restriction to existing inquiry capture.

## Validation

- 102 test files / 2,239 tests passed, including launch navigation and unknown/failed/mixed operational data cases.
- Dependency security: 4 tests passed.
- Typecheck and lint: passed; two existing private-image optimization warnings, zero lint errors.
- Desktop and 390×844 mobile visual inspection: Blog label, collection controls, cards, editor dialog, centered crown wall, navigation crowns, operational charts and honest empty reporting panels.
- Preview browser observed at 904 px desktop → 390 px phone → 904 px desktop. Embedded viewport is 390 px in phone mode. Transitions use the theme stylesheet and respect reduced motion.
- Temporary local fixtures used for visual checks contained no customer data and were removed before release. No customer content, domain, plan, launch approval or notification records were written.
- Clean production build passed. Hosted CI/release evidence is appended after completion.

## Release and rollback

Shared Vigil only. No database migrations/backfill, dependency changes or Scar repository changes. Rollback is a normal revert of this UI change followed by the existing shared deployment pipeline. Content entitlement, upload, publishing, optimistic concurrency, runtime integration and export contracts remain unchanged. Scar's production approval gate and Preview remain intact.

See PLAN.md and evidence/ for the implementation scope and screenshots. The earlier Content Hub implementation/release evidence remains in ../content-hub/REPORT.md.
