# Files upload and layout release — 2026-10-14

## Diagnosis and immediate repair
The supplied original QuickTime MOV is 95,274,457 bytes (90.86 MiB). The browser failure was a TUS creation request returning HTTP 413, “Maximum size exceeded”. Scar's UI reported 500 MiB per file, 77 of 80 records and 455 MiB of a 10 GiB allowance. Her private project-assets bucket allowed QuickTime and 524,288,000 bytes, but the provider's global Storage setting was only 52,428,800 bytes. That global ceiling takes precedence over the bucket.

The existing provider setting was aligned to the already-approved bucket/application allowance of 524,288,000 bytes with a partial Management API update and verified readback. Account quota/plan rows, bucket privacy and MIME types were preserved. No database migration or backfill.

The exact original MOV was uploaded through private resumable Storage in 6 MiB chunks using an existing server administrator credential solely for transport validation, downloaded and compared byte-for-byte by SHA-256. Both hashes match and the size is unchanged. The temporary test object was removed; no customer file record or notification was created. This verifies the rejected storage layer; it does not claim a customer authoring/notification flow was run. The original local file was not modified or converted. See ROOT_CAUSE.json, STORAGE_LIMIT_FIX.json and ORIGINAL_VIDEO_UPLOAD_PROOF.json.

## Shared UI and upload behavior
Desktop Add files is a sticky panel that fills the visible scroll viewport while retaining 24px bottom clearance. It measures the actual dashboard position, adapts during scroll/resize and lets short viewports scroll the panel contents. The dashed drop zone fills remaining panel space and centers its chooser and text. Mobile uses normal flow.

All files / Images / Videos / Documents / Other filters include real counts, an active pressed state, a result count and a filtered empty state with Show all files. Photos include HEIC/SVG; videos include QuickTime/M4V. Existing project selection, ownership, library tiles, captions and storage remain intact.

Large uploads use the documented direct Storage hostname, with local/custom origins preserved and the existing 6 MiB chunks. The UI distinguishes preparation, upload and registration. A synchronous guard prevents competing chooser/drop batches. Per-file errors preserve specific size/session/network/permission reasons; the prior stale-state check that replaced useful errors with a generic message is removed. No provider URL/token is surfaced in customer error text. The busy state is released after errors.

## Validation
Original video transport: passed, checksum matched, temporary private object removed. Local browser fixture: desktop viewport fit and center, panel top pinned 24px inside main after scrolling, bottom gap 24px, media filter counts/results, empty-state reset, and mobile width 390px with zero horizontal page overflow. Temporary fixture route removed before production build.

Typecheck, lint, dependency checks and production build passed. The first full test run had 2,270 passing tests and one existing Design Engine render timeout at its unchanged 5s budget under concurrent checks. The complete rerun passed 107 files / 2,271 tests with two workers; no assertion or timeout was relaxed. Nine new focused regressions cover the actual MOV size, mixed media, direct/custom/local hosts, safe 413/session/network messages, TUS completion/failure, expired session and small-upload compatibility. Hosted push/PR SQL/type/lint/test/build gates are required before merge, with main CI and Ready Production source verified at closeout.

## Boundaries and rollback
No Scar source, published content, full-site approval/lifecycle, domains or contact activation was changed. Scar remains Preview pending actual second-review approval. No customer messages, appointments, purchases or notification testing.

Rollback UI by reverting this shared merge and deploying through the normal main pipeline. Keep the corrected provider ceiling aligned with the existing 500 MiB application/bucket contract; restoring the incorrect 50 MiB value would reproduce the reported failure. A policy change to reduce the allowance should update all layers together. No schema rollback or customer data conversion is required.

Release checkout: /tmp/vigil-content-hub-release. Original workspace application edits and older release artifacts are preserved. Final closeout evidence is copied into the original workspace without a docs-only production deployment loop.

Documentation verified with the find-docs Context7 workflow and installed Next.js 16.3.8 guides:
- https://supabase.com/docs/guides/storage/uploads/file-limits
- https://supabase.com/docs/guides/storage/uploads/resumable-uploads
