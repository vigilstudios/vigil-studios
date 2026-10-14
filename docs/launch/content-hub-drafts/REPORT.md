# Content Hub draft workflow release — 2026-10-14

## Result
Lead Hub stays available without a crown. Unavailable paid tabs use dim text and bright icons/crowns and open their upgrade wall. Insights and Virtue keep locks and have no clickable destination; direct bookmarked pages show coming-soon content.

All collection libraries now share Blog-style All posts / Drafts / Trash, search, Table / Post feed, and Add a post controls. Tables include rounded thumbnails before title/description. Drafts contains only saved changed/new entries compared with the actual published snapshot; unchanged published entries are excluded. Edited/new records remain outlined in the theme brand green until published, including saved drafts and after reload.

A contextual changes bar and explicit Save draft / Publish changes controls replace the permanent collection action toolbar. Publication remains atomic for a whole collection; UI copy explains that scope. Unpublish entire collection is a separate confirmed action. Existing optimistic revisions, server entitlement checks, schema validation, placeholders, private uploads, and delivery validation remain intact. No database migration or customer backfill.

A shared leave dialog protects internal links, site/collection switches, organization switching, sign-out and browser Back. Save draft and leave, Publish and leave, and Leave without saving retain the requested destination. Failed saves keep the dialog and edits. Hard refresh/tab close use native browser beforeunload protection; browsers do not allow custom HTML for that prompt. History traversal restores the current entry while a decision is pending, which can replace forward history.

## Validation before release
- Node 24 typecheck: pass.
- ESLint: pass, zero errors/warnings.
- Vitest: 106 files / 2,262 tests pass, including 15 new classification/navigation regressions.
- Dependency security: 4 checks pass.
- Production build: pass, without provider environment or temporary fixture route.
- Local browser desktop/mobile acceptance with synthetic in-memory persistence: saved-only drafts, thumbnails, green outlines, Save/Discard/Publish navigation choices, failed-save retention, Back protection, publication/unpublication confirmation, and no mobile overflow.
- Scoped production-backend QA fixture created without auth users, email, external provider jobs or charges. Real browser persistence and final live verification are recorded below after deployment.

## Release requirements
Require both push and pull-request hosted CI (including fresh SQL validation) before merge; verify merged tree, main CI and Ready Production deployment. Production-backend acceptance uses only the isolated QA organization and exact cleanup scope. Scar customer content stays read-only. Scar source/full-site Production remain unchanged; her Preview remains pending second-review approval.

## Rollback
Revert the shared release commit/merge and allow normal main deployment. No schema rollback or customer record conversion is necessary. Saved drafts use the existing storage/RPC semantics. Do not promote or rollback Scar as part of shared dashboard rollback.

## Evidence
Desktop/mobile screenshots are in evidence/. LOCAL_CHECKS.txt records local gates. Final hosted/live proofs and QA cleanup are added at closeout.

Navigation implementation follows bundled Next.js 16.3.8 Link/event behavior and current Context7 documentation. Browser limitation reference: https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API.
