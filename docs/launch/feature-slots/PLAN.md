# Featured positions implementation plan

Use actual binding configuration for capacity; no website IDs or arbitrary section counts in shared UI. Scar's delivered standalone Portfolio declares three video slots. Replace checkbox with numbered slot selectors, filled count, eligible-media filtering, swap/replacement, per-post position and incomplete-draft guidance.

Store optional featuredOrder independently of list order; retain old featured booleans and their legacy relative order until explicit edits. Preserve metadata through Lab, media publication and owner exports. Validate configured capacity, uniqueness, range and media eligibility in client/server and database. Keep fixed-section full-publication rule and private partial drafts.

Add migration45 without rewriting any customer rows. Validate in disposable PostgreSQL before linked dry-run/apply/types generation. Run shared tests, type/lint/build plus SQL/RLS; Scar both build modes and renderer checks. Verify real controls in isolated browser with fake persistence and phone dimensions, then hosted controls with unsaved reversible changes only.

Release Scar adapter only to its existing review branch/Preview, then shared app to live after green pre-merge CI. Keep actual website status/review/contact/domain and saved/published content unchanged; account for current customer revisions rather than stale prior-task snapshots. Record exact source/deployments, CI, screenshots and hash manifest; preserve original dirty checkouts.
