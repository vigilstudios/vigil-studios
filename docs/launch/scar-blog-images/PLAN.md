# Blog images and sample articles — 12 October 2026

Founder authorized image uploads and a few sample posts to inspect the actual Scar UI. Extend the reusable Professional/Growth Blog service, retaining explicit onboarding scope and the full-site approval gate.

- Add private server-decoded JPG/PNG/WebP uploads, 3 MB input limit, pixel limit, 1600px output bound and WebP conversion stripping embedded metadata. Reuse existing project-file quota rows and the mobile-safe upload control. No SVG, arbitrary remote URL or browser storage-write bypass.
- Store server-derived website/organization image registration; save cover/inline references, alt text and captions through authenticated Blog RPC. Check same tenant and same website, preserve media for older text clients and require image descriptions before publishing.
- Private editor preview signs authorized tenant images. Public API signs only cover/referenced images from a published article on an approved-live site. Signed image URLs last one hour; previously issued URLs are not instantly revoked on unpublish. No drafts become public.
- Display images in listing cards and full articles, with captions, heading/paragraph flow and responsive proportions. Create three visibly marked layout samples using existing gallery images and placeholder writing. Samples compile only in Vercel Preview/explicit local review mode and are absent from Production bundles.
- Run upload/decode/request-limit, authorization, cross-tenant, public-media filtering and database tests; typecheck/lint/build; test rendered samples on desktop and phones plus the actual authenticated upload/draft flow. Never submit a real contact inquiry or send a review email as a test.
- Deploy shared Vigil changes under standing authorization; update only Scar's review branch. Keep Scar production and customer launch/approval untouched. Record the exact review links and practical limits.
