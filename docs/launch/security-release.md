# Approved dependency security release — 2026-10-11

Prepared from the current production main source, d3db65cedb150ab6375283852a300bfebb92f638, preserving its Webpack build setting, locally bundled fonts, catalogue and website-finder changes. Only approved Task 04A dependency/security changes and release verification gates are included; the shared checkout's unpublished Professional/design/customer work is excluded.

Next/eslint-config-next are pinned at 16.3.8, Vitest at 4.1.11 and Vite at 7.3.6. The lock fixes sharp 0.35.5/librsvg 2.63.2 and source-map-js 1.2.2. React remains 19.2.4. Both npm audit scopes report zero vulnerabilities on the prepared source.

The dev-only fast-glob → micromatch → braces chain is removed by the version-scoped Next lint adapter in tools/next-eslint-glob. Its API limits and deliberate rejection of numeric/step ranges are documented there. npm run test:dependency-security verifies actual dependency resolution, matching, real Next lint diagnostics and bounded deep-pattern handling. CI runs this check. scripts/verify-image-runtime.mjs also runs during prebuild, checks the loaded sharp/librsvg versions and benign SVG decoding, and emits version-only evidence into CI and Vercel build logs. Updating this native baseline requires an explicit dependency security review.

Release-source verification: clean install, type check, lint, four security regressions, all 2,096 tests / 89 files, production Webpack build and local migration/RLS validation passed. No .env files or provider secrets were supplied to local verification. Actual GitHub CI and Vercel deployment status must be verified for this release commit; local results do not imply a successful hosted deployment.

The owner explicitly authorizes deploying approved code changes live. The release is intended for the established main → Vercel production integration. No hosted migration, provider/billing setting, customer transaction or email is part of this deployment.

Production's Supabase ledger includes Professional 0028–0029 and growth_site_name 0031, absent from this published source's migration tree. This known source/history gap needs a separate reconciliation task; do not repair history, replay applied migrations or publish unrelated application changes to hide it. The security release changes no schema.

For later rollback, prefer a verified artifact retaining these dependency fixes. An older production artifact or package lock can restore known vulnerabilities. Verify commit attribution, domains, runtime/native build evidence and public smoke responses before declaring this release live. Full tenant/application security and real-provider acceptance remain separate launch gates.
