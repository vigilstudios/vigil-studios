# Content Hub operations

The founder's latest policy controls: self-service requires a Professional/custom website and an attributed Care, Growth or Priority recurring hosting plan. Basic and every Express website remain locked, with the Hub destination visible. Customer capability fields and generic onboarding intent cannot enable modules.

## Migration and backfill

Migrations 20261013000040–42 and 20261014000043 are additive and were validated in a throwaway PostgreSQL database before application to the linked production Supabase project. They introduce scoped bindings, shared collection snapshots/history, private media reservations, frozen exported runtime documents, and publication snapshots for existing Blog rows. Migration42 returns explicit HTTP409 for stale editors; it preserves the existing function ACLs and transaction guards. Never edit an applied migration.

The generic `scripts/content-hub-backfill.mjs` defaults to a dry run and accepts an explicit website plus a manifest extracted from verified delivered source. Apply only reviewed manifests. Insert-if-missing imports never overwrite an existing collection or Blog/customer edit. Preserve the dry-run, apply and replay receipts and source/manifest hashes. Professional discovery uses actual section collection fields, not a CMS checkbox. Removed auto-discovered bindings are disabled, retaining records and history.

Scar imports only Portfolio10, Gallery56 and marked Testimonials6 from reviewed source2a73e23. Blog retains the existing three rows and their UUIDs/addresses, including the customer café heading and camera cover. Homepage camera slots remain exactly three featured videos. New items belong to full collection/detail views unless intentionally selected for an existing featured slot. Do not clear testimonial placeholder flags without confirmed publication permission.

## Publication and export

Draft saves retain the last published snapshot. Collection publication validates canonical fields and the actual renderer before the transaction. Trash is reversible and removes the affected published record only when the remaining section is valid. Explicit unpublish retains saved records and hides the bound section. Frozen runtime documents keep layout/theme/choreography independent from subsequent Hub edits. Lab and Hub saves share collection revisions and reject stale edits atomically.

Published delivery requires the selected website's paid hosting and lifecycle; authoring additionally requires self-service eligibility. An eligible paid building website may render published review content without becoming live. No lifecycle, design approval or launch approval is inferred from content publication. Preview deployments cannot use the shared production service-role client under the existing policy.

Metadata ZIP exports retain saved drafts, publication, Trash and media IDs under existing export/ownership agreements, including after an authoring downgrade. Original uploaded media downloads through Files; large videos are not buffered into a metadata ZIP. A hosting transfer must configure the receiving framework's content adapter to use the snapshots. The export does not claim a complete offline video archive or turnkey hosting transfer.

Video uploads reserve exact tenant/site paths and consume existing file-library quotas, then upload directly through signed resumable TUS. MP4/WebM limits are the existing storage bucket maximum500MB and the applicable per-website allowance. Images normalize to WebP within the existing3MB/1600px rule. Publication-scoped media redirects sign short-lived storage URLs; draft URLs require the authenticated tenant/capability. Only referenced media is deliverable.

## Release and rollback

Shared source is released from its isolated checked branch after SQL/RLS, unit, typecheck, lint, build, hosted CI and browser checks. Merge current remote main before release; never deploy an older snapshot over intervening marketing work. Scar remains Preview: its main45d4358 and production deployment are unchanged until actual second full-site approval and the existing launch gate.

For an application rollback, revert the scoped feature commits through a reviewed branch while preserving subsequent source changes. Keep additive tables/snapshots/history and paid content; do not execute a destructive down migration. If delivery is unhealthy, disable only the affected binding through an audited staff operation and restore its prior source/runtime. Restore prior application delivery before disabling a dependency used by an already integrated standalone site. Keep Scar's last approved review source available. Never blanket-disable tenant data, reset customer records or release a reserved published address.

Temporary validation uses explicitly marked building websites, isolated organizations and test-only auth users; no customer email or launch approval is generated. Remove only those named fixtures and their exact uploaded paths after evidence capture.

Staff-only Lab delivery can save bound drafts on paid eligible Basic builds; the customer Hub and upload APIs stay locked. This preserves existing build operations without granting customer self-service. Express remains excluded, including from this internal collection path.
