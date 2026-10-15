# Lab featured sections, launch access, and video sound

## Implementation plan and decisions

1. Derive compatible Content Hub collections and their capacity from each pinned component schema. Persist explicit per-section `contentHub` settings through Lab, Site Definition parsing, export and the generated runtime. Include Products (arrays, wrapped products and singleton products), Portfolio, Gallery, Testimonials, Services and FAQ where the component actually implements the semantic collection. Unconfigured or incompatible sections expose no featured controls.
2. Save Lab settings and collection drafts atomically. Retain stable IDs, all non-displayed records, content order and media ownership. Snapshot the published featured policy separately; draft changes to capacity, selection or enabling/disabling featuring cannot silently change published selections.
3. Separate customer plan eligibility from authoring access. Customers need Care or higher, Professional/Growth, active hosting and a live site. Eligible prelaunch customers see a launch wall, others retain the paid wall. Staff can edit eligible component families before launch, including Basic builds; Express remains unsupported. Enforce at RLS, media, legacy Blog and actor-bound mutation RPC boundaries.
4. Open Scar videos with sound and provide a corner speaker toggle. Keep ambient/scroll previews muted, pause exiting/unmounted videos, respect reduced motion and recover honestly from rejected playback. Restore missing original audio to six optimized clips without re-encoding their picture.
5. Validate disposable SQL/RLS, linked migration dry run, generated types, unit/integration checks, typecheck/lint/build, desktop/mobile browser acceptance and hosted CI. Release shared Vigil to Production; merge Scar only into the existing Preview branch. Preserve customer data and the second-review gate.

## Migration and data

Additive migration `20261015000046_content_launch_and_lab_features.sql` passed the full disposable migration/RLS suite before the linked dry run and application. Only migration046 was pending. No customer collection backfill, revision change, post update or lifecycle change is required. Linked type generation adds only the new eligibility RPC and private helpers.

The user’s latest launch-gate request supersedes the original prompt’s prelaunch customer-authoring requirement. Public approved preview delivery is intentionally independent of customer authoring access. Staff still author the same existing records.

Audio was muxed from the original source-media clips into the optimized MP4s with AVFoundation passthrough. All six compressed video sample SHA256 values matched before/after. See `AUDIO_RESTORATION.txt`. Original files are unchanged. The six regression checks assert both audio and video tracks remain present.

## Validation and release receipts

Local logs, SQL assertions, screenshots, source manifests, hosted CI and final deployment receipts are stored alongside this report. Final source/URL and live acceptance details will be appended after deployment verification.

## Rollback

Revert only this release’s source commits if needed; rebuild the generated runtime from that source. Keep the additive authoring gate in place while preparing a validated forward repair, so a UI rollback does not reopen prelaunch editing. Published featured snapshots and customer content remain intact. Restore the prior six optimized assets only if audio restoration itself proves faulty; their original source media remains available. Scar must never be promoted to Production without actual second-review approval.

## Remaining approval

Scar’s full site remains Preview-only pending her actual second review. This task does not send customer notifications, create approvals, change domains or mark the website live.
