# H09 / H16 production follow-up — 1 October 2026

The user's reaffirmed approvals and subsequent explicit request to productize H09 and H16 authorize this follow-up. The canonical ledger in `registry/creative-review.ts` remains unchanged, including its historical instruction to defer migration during the earlier approval-recording task. That task is over; this implementation is a separately requested pass.

Both concepts now pass Experimental → Review → **Production v1.0.0** through the existing lifecycle helper, with their own current-pass evidence. Hero approvals require current evidence and cannot borrow the 004–005 defaults. Other Hero/Navigation lifecycle statuses and held/rejected studies remain unchanged. The registry now has **68 entries: 32 Production, 7 Review, 29 Experimental**. Composition Lab has **63 QA combinations**.

| Approved concept | Production ID | Preserved structure | Content/media boundary |
| --- | --- | --- | --- |
| H09 · Object Study | `hero.object-study` | Contextual copy/material lane, broad rounded object plate and outer object reference | One image; category/reference ≤80 characters, title ≤180, optional description ≤400, material note ≤180, optional object number ≤12 and optional client action |
| H16 · The Vertical Record | `hero.vertical-record` | Central rectangular image spine spans the context/copy rows; a dated record occupies the separate right lane | One image; category/reference/record label ≤80, title ≤180, optional description ≤400, required action; 2–5 unique records with date label ≤40 and text ≤100 |

Both are section-oriented Heroes with exactly one h1. H16's record is a labelled aside with an h2 and an ordered list. Dates may be years, seasons or program phases, so arbitrary authored labels are not falsely emitted as machine-readable timestamps. Record IDs are unique. There is no carousel, autoplay, fake counter or pointer-only timeline.

Executable strict payloads live in `composition/schemas.ts`; serializable capabilities live in `composition/catalog.ts`. Two independent implementations live in `sections/heroes/`. They contain no calibration copy, images, routes or local state. Lab-only adaptations and asset imports live in `preview/hero-followup-fixtures.ts`. The original H09/H16 calibration implementations and approval notes remain available in Creative Calibration 003.

## Creative layers and media

All ten typography profiles are supported. H09 supports Gallery, Salon and Precision; H16 supports Runway, Publication, Gallery and Precision. These affect actual gutters, pauses, frame inset/width, record spacing/rule weight and action shape. H09's rounding remains structural even under Precision; H16's spine remains rectangular under Gallery. Geometry is deliberately fixed to `portrait-emphasis`. Natural, monochrome and high-contrast tone act on images only.

H09 is static at every site intensity. H16 optionally reuses the existing MediaReveal with a -60px authored left offset and a left-to-right image reveal. Intensity scales through the existing policy. Standard presets remain static; the H16 alternate opts into reveal with restrained intensity. Copy, CTA and records always remain readable. OS reduced motion or site motion none replaces the animated surface with complete static media, including during a running reveal. No new motion mechanism was added.

One image is mounted per Hero. Existing TreatedImage supplies intrinsic dimensions, alt, optional captions, srcSet/sizes, mobile source and focal points. Hero images are eager with high fetch priority and async decoding. Clients supply crop-ready media; a portrait/mobile source is useful for H16's narrow spine. The illustrative landscape performer deliberately demonstrates a demanding crop and is not a required production asset.

Actions are ordinary native client-owned links, with bounded labels and safe destination prefixes; whitespace, control characters and backslashes are rejected. H09 works without an action; H16 has one clear action. No original-study Figma link is carried into the runtime component.

## Composition and responsive behavior

Both participate in strict parsing, exhaustive runtime and individual rendering, registry discovery, controlled section overrides and the existing Lab editor. Each has two unlike Navigation → Hero → Story → Services → Work QA sequences. They use different navigation, typography, art, brand and neighboring structures; these are compatibility exercises, not templates.

Existing singleton and ordering rules apply. Both declare a solid inherited surface and **no overlay safe zone**. Overlay navigation is rejected instead of silently covering the proposition. Neither owns sticky positioning, scrolling, listeners or a viewport-height assumption. Authored section spacing remains local.

H09 places context/copy before the rounded plate and its outer reference on mobile. H16 places context/copy/action first, then retains the image and record as adjacent lanes. Titles use bounded scales; long copy expands document flow. H09's title scale was tightened and its structural selector made more specific than the shared typography rule to prevent a standard word breaking mid-word on desktop. New action labels are bounded by their copy lane. No clipping is used to conceal text overflow.

## Verification

The repeatable browser script is `scripts/design-engine-hero-followup-qa.mjs`; [recorded evidence](./evidence/browser.json) and desktop/mobile screenshots are retained here. The disposable harness uses real Chrome viewports and local licensed Lab fonts.

- **52 layout/content/boundary checks:** both Heroes at 1920, 1440, 1280, 768, 390 and 320px; three unrelated adaptations with short/standard/long copy; minimum and maximum dated records at desktop/mobile.
- **70 mobile type/art combinations:** all declared profiles/directions with long copy.
- **12 composition checks:** all four new mixed sequences at desktop/tablet/mobile, with one main and one h1.
- **4 axe-core audits:** both Heroes at desktop/mobile, WCAG 2 A/AA and 2.1 AA tags; zero violations.
- Native action focus is retained with a visible outline and a minimum 44px target. Real destinations, optional H09 action, active-image count, eager priority, rounded/rectangular framing and site-none/OS reduced-motion states are checked.
- H16's live reduced-motion check waits for the next React commit, with a one-second upper bound, and then requires no clip, transform or opacity reduction. A preference notification occurring before that commit is not treated as rendered policy state.
- No unexpected errors occurred in the fixture browser. Authenticated production-build Lab verification is recorded separately in `evidence/lab-workflow.json`.

Repository checks: **57 test files / 341 tests pass**, typecheck, lint, production build and `git diff --check` pass. Logs are retained beside browser evidence. The existing broad composition test now distinguishes a fully invisible opacity-zero payload from the deliberately supported 0.7 image-only reveal, and recognizes the two additional Hero structures.

Both implementations remain server-capable. Only the optional H16 reveal enters the existing client motion boundary. No dependencies, fonts, per-frame state, subscriptions, scroll observers beyond the existing reveal, or image preloading loops were added. [Performance evidence](./evidence/performance.json) measures source contributions in the full disposable harness; it is not a client-site bundle claim.

To reproduce, bundle with `DESIGN_ENGINE_AXE=node_modules/axe-core/axe.min.js node scripts/design-engine-qa.mjs`, serve `/tmp/vigil-design-engine-qa` at loopback port 4177, then run the follow-up QA script with `PLAYWRIGHT_MODULE` pointing to an existing runtime if needed. The harness supports `?lab=design`, `?lab=composition` and record-boundary `?scale=minimum|maximum` checks without adding an application route.

## Handoff

H09/H16 migration is complete. The old review notes and Pass 006 dossier are historical records, not pending work. Continue to preserve both original studies and the independent runtime systems. The next creative campaign remains Collection 007 — Commerce / Product Presentation. It was not generated here. No page templates, detail routes, commerce backend, dedicated Motion expansion, overlays/transitions, AI composition, Express changes or Scar work were introduced.
