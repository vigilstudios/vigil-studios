# Productionization Pass 004–005

30 September 2026. This pass implements the approved Brand / Story and Media / Work structures and stops before Collection 006. Human creative selection and implementation QA remain distinct. Source studies, artwork and dispositions remain in Design Lab.

## Dispositions

| Collection | Production implementations (version 1.0.0) | Held studies |
| --- | --- | --- |
| 004 | S01 Object Biography; S02 Manifesto Fold; S03 Working Conversation; S06 Decision Ledger; S07 Open Letter; S08 Material Relay | S04 remains Promising / Revision Required, awaiting confirmation of the arrow correction. S05 remains Rejected and historical. |
| 005 | M01 Open Index; M02 Project Chapters; M04 Contact Room; M05 Screening Room; M06 Photographic Promenade; M07 Gallery Hanging; M08 Campaign Folio; M09 Look / Closer; M10 Campaign Score; M11 Media Cabinet; M12 Light Table; M13 Viewport Gallery (follow-up explicit approval) | M03 remains Revision required for meaningful relationships. |

The held/rejected studies have no executable composition registration. They remain in the creative Review workspace, outside production inventory. The previous 29 foundational registrations remain Experimental; the seven existing Navigation/Hero implementations remain Review. There are 54 registry entries, including 18 Production entries after the [M13 follow-up](M13_PRODUCTION.md).

`registry/creative-review.ts` is now the canonical serializable ledger; the original study `review.ts` modules re-export the same records. Status text, notes and revisions were preserved. The promotion helper checks this ledger and calls the established Experimental → Review → Production lifecycle gate. Tests reject promotion of S05 and M03. M13's later explicit approval is recorded separately. Production evidence attributes creative selection to the user's existing ledger and implementation verification to Codex; it does not invent a new human sign-off.

M13 was held pending review during the initial pass. The user subsequently approved it and requested its Composition Lab addition. [M13 production notes](M13_PRODUCTION.md) record its independent content/media contract, approval evidence and follow-up verification. Earlier browser counts below describe the original 17-component pass.

## Executable contracts

`composition/collection-schemas.ts` adds separate strict schemas; the existing S01/S03/S06 schemas remain authoritative. No universal title/image/button payload replaces a narrative.

| Structure | Required relationship / bounds |
| --- | --- |
| S01 | One artifact, exactly three observations, origin and continuation |
| S02 | 3–6 statement/explanation principles |
| S03 | 2–4 questions, attributed speakers, roles, answers and optional asides |
| S06 | 2–5 principle/tension/practice/rationale decisions; open or native disclosure |
| S07 | Salutation, 2–5 paragraphs, signoff/signature, optional postscript |
| S08 | Exactly three independently authored image/responsibility stages |
| M01 | 3–12 independent project covers and records |
| M02 | 3–8 ordered scenes, narrative, explicit contain/cover, optional evidence with its own caption |
| M04 | 4–24 proof frames; dedicated thumbnails required above eight; dimensions ≤960px |
| M05 | 3–30 frames; stable contained stage, one active image mounted |
| M06 | 3–12 original-ratio scenes inside a native horizontal region |
| M07 | 4–12 uncropped works in authored source order; asymmetric hanging |
| M08 | 2–6 authored spreads; principal required, facing plate optional without filler duplication |
| M09 | 2–6 explicit overview/companion pairs and their relationship |
| M10 | 3–6 short chapter phrases (60 characters), crop/contain choice and complete counter-image |
| M11 | 4–24 discriminated image/video records; category filtering and native playback |
| M12 | 3–16 images; independently assigned wells; dedicated thumbnails required above eight; dimensions ≤960px |

All arrays with authored IDs reject duplicates. Strict objects reject extra styling, routes, commerce fields and generic incompatible content. Schemas bound titles, notes, explanations and transcripts; shared captions cap at 400 characters and alt at 1000. Optional media, notes, evidence, facing plates and postscripts are omitted cleanly. Invalid required media is rejected at the boundary rather than replaced with demo assets.

The shared image contract supplies intrinsic dimensions, meaningful alt text, desktop/mobile focal points, optional mobile sources, `srcSet`, `sizes` and captions. Proof/tray thumbnail images are decorative inside uniquely named buttons; enlarged images retain authored alt. Chapter and campaign crops are explicit per-image `contain`/`cover` decisions, protecting portrait subjects without inspecting a fixture brand. M08 principal imagery is contained. M11 video adds intrinsic dimensions, accessible label, poster, descriptive transcript, `hasSpeech`, and required caption-track source/language/label when speech exists. No autoplay, streaming provider, synchronization, cart or checkout is introduced.

Media is inline in the genuine chapter, pair, spread or record contract where the relationship requires it. A non-null media schema with `media: null` means the section has authored media but exposes no global image-treatment dropdown. It does not imply arbitrary geometry support. S01 retains its existing separate media/treatment inputs.

## Composition and future extension points

Every selected registration declares `usage`: section-oriented, page-capable, or section-and-page-capable. M02/M06/M10 retain page-capable sequences; M01/M04/M05/M07/M08/M11/M12 retain both usages; M13 retains page-capable usage; M09 remains section-oriented. This is capability metadata, not a page template or a route model.

Contracts declare finite compatible art directions, type roles/profiles, actual static motion support, allowed section overrides, content/media requirements, reading order and flow capabilities. Site/page brand and icons remain inherited. Only meaningful typography/art overrides are exposed; no ineffective local motion controls are added. All ten role profiles are supported through semantic roles and bounded structural scale; art compatibility is constrained to three useful directions per new structure.

Composition Lab retains A–E and 004 F–K and adds 22 QA combinations, with three Navigation systems, five Heroes, five site typography/art directions, alternate brand tokens and repeated alternating Story / Work bodies. These are internal tests, not recipes. Existing bounded ordering, singleton rules, controlled overrides and strict content/media editing remain. The inspector displays usage and requirements. Every approved component can be added, selected and reordered.

Non-blocking transition notices derive from `compatibility.flow`, for dark-room seams, edge-to-edge bands and horizontal regions. Existing explicit incompatibility reasons and transition notices remain. Flow-root section slots prevent child margin leakage; horizontal browsing is local, captions stay on opaque surfaces, and none of the new structures introduces sticky behavior or a navigation overlay safe zone. M05's neutral dark room is an intentional structural surface with a seam notice, not a section palette editor. Neighboring section rhythms remain authored rather than silently normalized.

No page recipes, routing, nested sites, detail pages, commerce, overlays, transitions, AI composition, Express generation or dedicated Motion Engine expansion were implemented. Components import no Lab fixtures, client brands, assets or routing APIs. Client projects retain their content, delivery adapters, licensed fonts and routes. This preserves later page composition without inventing its design now.

## Responsive, accessibility and browser evidence

- 85 long-copy component checks: all 17 at actual 1440, 1280, 768, 390 and 320 px browser widths. No section or text overflow. Later letter/relay refinements passed ten additional checks at the same widths.
- 44 mixed-page checks: all 22 compositions at actual 1440 and 390 px. No document/section overflow; one main/h1; no sticky body collisions.
- 530 mobile type/art combinations: all 17 components, every declared typography profile and compatible art direction, long copy, actual 390 px viewport and loaded local font fixtures. No document or section overflow.
- 34 axe-core audits: every component at desktop/mobile, WCAG 2 A/AA and 2.1 AA rules. Zero violations. These automated checks are not a full screen-reader or cross-browser certification.
- Manual axe findings: the video fixture is a silent six-second generated-still sequence with a descriptive transcript. The client speech contract requires caption tracks. Light-table text contrast is 12.58:1 on its opaque fixture surface and 9.88:1 against the darkest 13% dot-pattern mixture; inherited client palettes require their own review.
- Enter/Space: project disclosures, decision rationales, proof selection, screening pace, spread pace, paired-image selection, subject filters and independent-well assignment. Focus outlines were visible (3 px). Horizontal next/previous controls move and focus the destination figure. Filtered-out video is unmounted.
- Chrome DevTools emulated `prefers-reduced-motion: reduce`. All 17 retained complete resting content with no authored animation. Native keyboard navigation progressed the folio to its final spread under that policy. Closing DevTools resets its emulation; temporary viewport overrides are restored after QA.
- Authenticated Lab checks verify Design/Composition, retained studies, new inventory, strict inputs, reordering and capability controls. No public application route or auth bypass was added. A disposable loopback fixture harness checks real browser viewports independently from the desktop-only editor.

See [layout metrics](evidence/layout-checks.json), [type/art matrix](evidence/type-art-mobile.json), [refinements](evidence/refinement-checks.json), [axe results](evidence/accessibility-audits.json), [keyboard checks](evidence/keyboard-checks.json), [manual review](evidence/manual-accessibility.json), [reduced motion](evidence/reduced-motion.json), and the real [desktop folio](evidence/folio-desktop.jpg) / [mobile folio](evidence/folio-mobile.jpg) captures.

## Performance decisions

No new runtime dependency, animation library, page-flip library, lightbox or font catalog was added. Static narratives remain server-capable; only stateful galleries use client boundaries. Native image delivery is portable: the host supplies optimized URLs and responsive sources. Images reserve intrinsic sizes and use lazy loading/async decoding; thumbnail contracts bound large proof/tray delivery. The screening room mounts one full image, the folio mounts one spread, and look/closer mounts one pair. Video uses `preload="none"`, no autoplay and user controls. No scroll/pointer animation loop or per-frame React state was added.

The complete QA bundle includes React, Zod, existing Navigation/Hero/motion mechanisms and all preview fixtures: 487,545 bytes minified / 147,117 gzip at measurement. The eleven Work renderers plus their shared media shell account for approximately 12 KB of that minified output; existing Framer Motion contributes 108,257 bytes. This is a fixture-harness measurement, not a claim about every client site's final payload. Client sites should import selected components and load chosen fonts at their app boundary. See [bundle report](evidence/bundle-cost.json).

The browser caught a media CSS specificity issue before promotion: more-specific desktop rules defeated mobile spreads. Every runtime media selector is now consistently scoped; mobile folios become a plate with facing inset and adjacent controls. Portrait crop decisions no longer depend on the urban fixture brand. Letter marginal notes and relay stage cadence were rechecked after preserving their original study DNA more closely.

## Validation and reproduction

Initial-pass repository gates passed: `npm test` (54 files, 321 tests), `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`. The production build was loaded through `next start` and the authenticated Lab verified with the new compositions and strict editor inputs.

The browser console contained zero errors. The existing application-level `THREE.Clock` deprecation warning remains outside this component milestone. See [console evidence](evidence/production-console.json) and the [production Lab capture](evidence/production-lab-composition.jpg). This report does not claim every unrelated application warning was resolved.

For disposable viewport QA, run `node scripts/design-engine-qa.mjs` from the repository root, then serve `/tmp/vigil-design-engine-qa` on loopback. `DESIGN_ENGINE_AXE=/path/to/axe.min.js` optionally enables the native audit button without adding a project dependency. The harness imports preview fixtures only and creates no application page template. It copies licensed local font fixtures and illustrative media into a disposable directory, never into runtime component source.

## Astra handoff: Collection 006

The next campaign is Services / Capabilities / Features. Propose genuinely different service storytelling, capability indexes, interactive exploration, comparisons, expandable systems, sticky narratives, matrices and visual services. Do not start with a universal three-card schema. Preserve creative studies and human review before selecting implementations.

For each selected structure: define its actual typed content and media relationship and finite bounds; choose usage metadata; declare implemented type/art/motion capabilities and controlled overrides; describe reading order, accessibility and section edges; implement an independent route-free renderer; provide unrelated client adaptations and at least two unlike Navigation/Hero/Story/Work compositions. Validate extremes, responsive crops, keyboard/focus, reduced motion and delivery cost before evidence-gated promotion. Proposed future motion and page behavior remain proposals until implemented and checked. Collection 006 is not generated by this milestone.
