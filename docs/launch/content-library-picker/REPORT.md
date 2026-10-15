# Content Hub existing Files picker

The Portfolio/Gallery collection editor previously only opened a native local upload chooser. It had no path to use Files uploads, and its direct upload flow only accepted MP4/WebM. Scar's uploaded MOV was complete; the editor integration was missing.

The media form now separates **Choose from Files** from **Upload a new file**. The existing Files picker searches and filters compatible per-project media, includes MOV/M4V, and reuses the original stable asset ID. Each selected video has a private inline preview and its own image-only poster picker. Duplicate selection does not append the same asset twice. No new project_assets row, storage copy, staff notification or quota usage is created by reuse.

The additive `20261015000044_content_library_media.sql` function enforces owner/manager or staff authorization, eligible website/collection, matching organization/project/path/bucket, supported MIME and completed Storage metadata. Existing private media previews and publication-gated delivery resolve the asset's original allowed bucket. Existing draft/published reference and deletion protection remain in force. Blog keeps its own image contract; the user's active editor was Portfolio.

All shared collection filter buttons explicitly reset border radius to zero, preserving the Blog straight active underline in Gallery, Portfolio and Testimonials as well.

Validation: 109 files / 2,291 unit tests, four dependency-security checks and local SQL migration/RLS assertions passed. Browser checks covered search/video filtering, reuse selection, image-only poster attachment, full desktop fieldset width and phone fit. The temporary UI fixture and API stub were removed. The first typecheck/build cycle encountered generated references to that removed fixture; the dev type output was moved aside and clean typecheck/build rerun before release. Linked database types were regenerated after applying only migration 44; no existing migration was replayed.

Hosted CI, production identity and final live acceptance are recorded in the adjacent release evidence. Scar's actual posts and publication state are not validation fixtures. Her full site remains Preview pending review round two.
