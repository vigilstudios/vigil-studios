# Operations

- Verified both release branches and original working trees; preserved unrelated original application changes.
- Local all-migration/RLS validation passed, including same-tenant author roles, stale-delete refusal, Trash/Restore, trashed-save refusal and existing private image-reference protections.
- Applied only migration 20261012000039_blog_post_trash.sql to the linked Supabase project. Regenerated both public and vigil types from the linked database.
- Read actual scoped CMS state before conversion. The customer had edited the second post’s media since the preceding phase; retained that saved selection, existing authors, all registered private uploads and the saved café heading.
- Converted exactly three version-guarded existing posts to normal published articles while website status remained building. Removed placeholder boilerplate and captions and normalised addresses. No review approvals, website lifecycle changes, inquiries, messages or external purchases.
- Implemented tenant/role/version-guarded author Trash/Restore; public reads exclude trash and drafts, including building-site published reviews. Historical staff-only sample flag remains as an internal compatibility/safety field; new articles have it false and no visible sample status.
- Added stable public image resolver addresses that recheck published post/tenant/media visibility on every lookup before redirecting to short-lived private storage signatures.
- Local shared validation: 97 test files / 2,216 tests passed with two workers and a 30-second per-test ceiling for this workstation. A subsequent focused Blog run passed after allowing the same published review selector on live sites (never paused/suspended); hosted default full-suite CI will verify the final release.
- Production build, typecheck and lint passed before the final equivalent public visibility condition adjustment. Scar review renderer tests and desktop/mobile hosted audit are in progress.
