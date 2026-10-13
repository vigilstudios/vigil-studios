# Content Hub implementation — 13 October 2026

Status: IN PROGRESS. Founder instruction overrides the prompt's older Basic policy: Care and higher receive self-service Content Hub on Professional/custom (Growth Site); Express and Basic are locked. No prices or payment products change. Existing paid prelaunch authoring remains scoped to its website.

## Inspected baseline

Shared isolated branch `codex/content-hub`, `/tmp/vigil-content-hub-release`, starts at remote main bdd2e00. Scar isolated branch `codex/scar-content-hub`, `/tmp/scar-content-hub-release`, starts at remote reviewed source 2a73e23. Original dirty checkouts and prior worktrees remain untouched. Existing Blog uses private normalized images, tenant RPCs, optimistic timestamps, ordinary published posts and reversible trash. Its eligibility currently comes from project scope, with no per-website recurring gate. Professional sections already have strict schemas and stable section/page IDs; its runtime currently renders only on the client. Existing file quotas and TUS dependency are reusable.

## Implementation sequence

1. Add versioned website collection/binding records, strict module payloads, revision/history, separate draft/publication snapshots, website-attributed entitlements, server/RLS/storage guards. Preserve Blog rows and URLs; backfill only verified existing bindings.
2. Build selected-website Hub, locked/empty states, supported tabs, reusable visual editors, table/cards, preview/save/publish/unpublish, accessible order controls and Trash/Restore. Retain Files as the general library and Blog visual editor compatibility.
3. Derive supported bindings from real Professional section collection fields; integrate explicit Lab saves with collection authority using revision checks; generate SSR runtime and binding exports. Do not infer modules from generic CMS onboarding intent.
4. Add resumable private media upload reservations using existing quota rows, signed TUS tokens and publication-scoped delivery; no large request-body buffering. Keep video posters and lazy playback.
5. Import Scar Portfolio/Gallery/Testimonial records idempotently from the verified review source and connect a standalone adapter. Preserve existing design/route/hero/motion data, Blog IDs/customer edits and testimonial placeholder labels. Homepage featured slots stay explicit.
6. Run isolated SQL/RLS tests, unit/integration tests, typecheck, lint, build, hosted CI and desktop/mobile browser/performance QA. Validate additive migrations before applying them. Release shared feature live only after gates pass. Scar remains Ready Preview pending real second-review approval.
7. Record exact sources, URLs, changed files, validation evidence and rollback/backfill procedure; update the master closeout plan.

## Release boundaries

No customer messages, appointments, domains, payment products, fake approvals or lifecycle changes. Additional videos were requested once; integration proceeds with existing authorized assets. No subagents. A failed publish retains the prior publication. Rollback disables affected bindings/routes and reverts application source while retaining records and audit history; no destructive down migration.
