# Files video upload and layout — 2026-10-14

Diagnose the supplied original 95,274,457-byte MOV through local metadata, existing customer usage, browser failures, bucket policy and provider settings. Fix the verified 50 MiB global storage ceiling conflicting with the already-configured 500 MiB bucket/app allowance; keep bucket privacy, MIME limits, quotas and tenant checks unchanged. Verify the original file with an isolated private transport test; do not publish customer content or send notifications.

Improve upload progress, actionable error handling and resilient cleanup so failures identify the cause. Prefer the documented direct storage host for large resumable uploads.

Give Files a desktop sticky Add files panel occupying the available viewport with bottom clearance. Its padded drop zone fills the panel and centers the chooser/copy. Keep mobile in normal document flow. Add All / Images / Videos / Documents / Other media filters with real counts and a filtered empty state. Preserve file ownership, captions, existing project selection and account limits.

Validate focused upload/filter regressions, typecheck/lint/full tests/build and hosted SQL gates. Verify desktop sticky behavior and mobile overflow in browser; release the validated shared feature live. Preserve Scar's full-site Preview/review boundary and all existing content. Deliver root-cause, provider/readback, upload checksum, screenshots, exact file list, deployed-source and rollback evidence.
