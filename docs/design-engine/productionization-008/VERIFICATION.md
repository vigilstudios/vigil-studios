# Productionization Pass 008 — completed 5 October 2026

Follow-up: [E06 committed-motion correction](MOTION_COMMIT_FOLLOWUP.md) fixes a pause-state bug missed by the original hover/commit checks. Selected section, page and inherited site motion now resume after automatic still mode; 19 new browser regressions cover those transitions.

All twelve approved Collection 008 designs have independent Production v1.0.0 systems. The user's approval of the entire collection supersedes the historical shortlist; there was no additional selection phase. The engine host is `vigil-studios`. No Collection 009, external verification service, full page, page recipe, multi-page architecture or broad Motion milestone was implemented. Scar and `vigil-leadgen` were not modified.

## Production inventory

| Study | Production ID / name | Evidence model and scale | Usage / required motion capability |
| --- | --- | --- | --- |
| E01 | `proof.margin-voice` — A voice, in the margin | One high-value attributed voice beside an annotation | Section; optional media reveal |
| E02 | `proof.outcome-equation` — The outcome equation | One measured before/after equation, basis and supporting voice | Section; optional fade, no artificial count-up |
| E03 | `proof.change-dossier` — The change dossier | Baseline → intervention → outcome, metric, voice and limitation | Section/page; media reveal |
| E04 | `proof.case-cross-section` — Case cross-section | One case's project context, challenge/intervention, measured result and voice | Section; media reveal |
| E05 | `proof.credential-library` — The credential library | 3–12 inspectable issuer/scope/date/expiry recognition records | Section/page; selectable accession with optional fade |
| E06 | `proof.moving-chorus` — People, in their own words | 3–24 distinct voices, ideal 4–9; no aggregate rating | Section/page; measured continuous loop plus complete still reading wall |
| E07 | `proof.review-reading-room` — The review reading room | 3–30 supplied reviews; sample average/distribution, source filter and selection policy | Page-capable; manual reading/filtering |
| E08 | `proof.in-conversation` — In conversation | One speaker and 2–6 full question/answer exchanges | Section/page; optional media reveal, manual transcript; optional user-controlled captioned video |
| E09 | `proof.relationship-register` — Relationships, over time | 4–18 dated organizations/roles/outcomes, optional supplied marks | Section/page; optional row fade |
| E10 | `proof.progress-trail` — Progress, with a paper trail | 3–6 real ordered observations, event/basis/source | Section; staggered observation reveal, plain chronology in none mode |
| E11 | `proof.evidence-desk` — Show the working | Qualified claim and 2–5 independently inspectable exhibits | Section/page; native exhibits and optional media reveal |
| E12 | `proof.story-switchboard` — The customer story switchboard | 2–6 cases, each challenge/intervention/metric/voice/source | Page-capable; manual selection, visitor-started 10-second sequence and optional fade |

These preserve the original spatial and evidence mechanisms: marginal annotation, numeric equation, three-stage transformation, panoramic cross-section, accession catalog, looping plural voices with unequal reading wall, review journal, interview transcript, dated relationship register, ascending chronology, exhibit desk, case selection. There is no generic testimonial/social-proof mega-component.

Every contract declares supported type/art profiles, semantic roles, media, finite scale, responsive reading order, section/page usage, motion/interaction capabilities, bleed/density/scrolling/sticky behavior and accessibility. All twelve support the ten existing typography profiles. E06 supports all six art directions; other systems declare compatible subsets from their study directions.

## Evidence integrity and contracts

See [the detailed evidence contract](EVIDENCE_CONTRACT.md). Provider-neutral types: EvidenceSource, EvidenceRecordSource, TestimonialAuthor, Testimonial, EvidenceMetric, CaseStudyEvidence, Recognition, Review, EvidenceArtifact and EvidencePoint; narrow section-level Transformation, InterviewEvidence and ClientRelationship. Existing SectionImage/SectionVideo remain the media contract. Logos belong to attributed supplied records rather than an invented customer wall.

Publication is the default; strict section parsing rejects illustrative provenance. A tiny runtime shell guard protects direct callers too. Lab fixtures explicitly set illustrative mode and display fictional-evidence/media disclosure. Fictional brand adaptations never relabel themselves as supplied evidence. Production source declarations retain attribution, timeframe, context, record reference and publication permission; verified declarations add URL/by/date/method. Verified-purchase labeling requires an explicit purchase verification record as well as verified provenance. This is metadata and validation, not external truth verification.

Review counts and averages derive only from the supplied sample, with visible selection policy and all ratings represented. Numeric relationships have text labels and basis; zero-baseline relative change is explicitly unavailable. Transformations and exhibits retain limitations/qualifications. Host destination keys/hrefs are safe and optional; no fictitious navigation or detail page is generated.

## E06 visual configuration

Four substantive styles: **typographic** (open quote rhythm), **editorial** (indexed, rule-led voices), **portrait-led** (media/quote split, graceful no-media reading) and **compact** (denser ruled surfaces). All retain the moving attributed-voice concept.

- Alignment: left, center, right.
- Quote scale: restrained, standard, large, display. These use body/heading/display roles, including profile family, weight, style, leading, tracking, transform and variable axes; responsive caps preserve reading.
- Author treatment: text-only/full attribution, compact name/organization, avatar, portrait, organization mark. Media is optional; absent marks/portraits leave attribution, never fabricated imagery.
- Surface: transparent, semantic surface, framed, full-bleed. Framing also applies to the canonical still wall; local bleed does not widen the page.

All are typed section capabilities available in normal Design Lab and Composition Lab. Fixed focus pause is shown as a property instead of a single-option dropdown. Unsupported vertical directions or focus-pause disabling fail schema validation. Loop controls hide/inactivate when motion is none; unrelated media or structural selectors are absent.

## E06 motion, responsive behavior and accessibility

Direction left/right; semantic slow/medium/fast speed; subtle/standard/expressive intensity; optional hover pause; fixed focus pause; none/soft edge fade; compact/regular/spacious gap. Intensity changes travel rate, breathing space and expressive vertical stagger, and respects the existing none/restrained/expressive site policy. Duplicate density is calculated for coverage rather than exposed as a fragile parameter. Vertical movement was investigated and excluded: it changes the approved horizontal reading model without a justified use case.

Desktop presents a continuously moving set of attributed voices in a locally clipped viewport. Complete groups include their trailing gap. One measured group width is the exact transform distance, with a constant semantic travel rate; reverse animation handles rightward motion. Coverage uses the minimum number of identical whole-cycle copies. No one-frame reset, blank end gap, cumulative JS drift or adjacent identical records at a cycle boundary. IDs must be distinct. Differing quote lengths, font/profile changes and optional author media are measured through resize/font events.

Mobile retains the loop at 65% of the desktop travel rate. Voice widths become 85% of the local viewport (compact 75%), reducing simultaneous surfaces; typography caps and portrait ratios adapt locally. No global overflow-x hiding. The canonical unequal desktop reading wall becomes one column on mobile. Supported range is 3–24, ideal 4–9; fewer voices are rejected. Large bounded sets are supported, not thousands of reviews or full transcripts.

An explicit persistent Pause/Resume control is always available during motion. Hover optionally pauses; focus anywhere in the component pauses, opening the source reading wall pauses, and pause persists after focus leaves. Links are used in the canonical reading view; repeated visual tracks are inert and aria-hidden, preventing duplicate announcements and moving tab targets. Native figures/blockquote/figcaption preserve quotation/attribution relationships. Text, links, controls and disclosures remain keyboard operable with visible focus.

OS reduced motion, site none or section none removes the loop DOM and observers and opens the complete canonical reading wall. Reduced-motion changes are respected live. Sources stay available, and no timer or compulsory swipe is needed. E12 starts manual, requires visitor playback activation, stops on focus/manual selection, suspends when hidden/offscreen/hovered and offers all-record reading; reduced motion removes playback controls. E05/E07/E08/E11 retain native/manual selection and disclosure semantics.

The persistent pause decision follows [W3C's Pause, Stop, Hide guidance](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html); hover/focus alone would not provide a persistent independent stop. Automated audits and keyboard checks are recorded below, not a claim of third-party conformance certification. Client palettes/media rights and source truth remain host review responsibilities.

## Performance and limited reusable motion additions

`MeasuredLoop` is a visual-only CSS transform primitive. It has one ResizeObserver covering viewport/original cycle, one IntersectionObserver and font completion hooks; resize/font measurements batch in one requestAnimationFrame. No animation-frame measurement or React render loop. Page visibility uses a shared useSyncExternalStore subscription, reused by E12. Offscreen/hidden/paused tracks stop and drop will-change; reduced motion unmounts copies/observers entirely. Animation uses a single linear transform, never layout properties.

The plain EvidencePicture leaf and tiny integrity guard keep Zod and reveal animation out of E06's browser dependency graph. Isolated minified E06 bundle is **8,428 bytes / 3,319 bytes gzip**, with React/ReactDOM external; this is not an application route budget. Review reading is 1,669 bytes gzip. Other motion systems share the installed reveal library (about 39–43 KB gzip isolated bundles; combined bundles deduplicate it), and eight outer evidence components remain server-friendly with small interactive leaves. The four client section roots are E05/E06/E07/E12. Responsive native images are intrinsically sized, lazy/async; video is user controlled with preload none. Duplicate cycles are bounded by the validated finite set and coverage geometry; typical geometry uses two complete visual groups plus one canonical wall.

Runtime sample: **zero DOM mutations over 1,200 ms** of continuous motion, one resize/one intersection observer, and zero remaining loop observers after reduced motion. Geometry tested forty combinations of four styles × five widths × both directions; each copy matches measured distance and covers the viewport. Exact period-boundary screenshots have identical SHA-256 hashes. No claim of a battery benchmark or a frame-rate guarantee on all devices.

No broad Motion Engine replacement. Later work may consider coordinated multi-component pause, global choreography, page transitions, vertical-reading motion or transcript synchronization. None is implemented here.

## Lab, composition and registry

All twelve normal production entries have default/alternate previews and three unrelated illustrative client contexts (security, strength, furniture), standard/long content and independent brand/type/art/motion layers. The original Collection 008 workspace/files are byte-preserved. A current approval/Production notice in its parent distinguishes historical review/shortlist wording from the canonical decision. Source hashes in `evidence/original-studies.sha1` verify all seven original files.

Composition gains twelve addable Social Proof & Results systems and **24 mixed QA compositions** (two per system). These combine the twelve mature production navigations, Full Scene/Scene Poster/Comparison/Front Page and commerce Assembly heroes, Brand/Story, Services, Work and Commerce neighbors with an existing content ending. E06 has both Services → voices → Work and Product Story → voices → Product Collection contexts. These are disposable QA assemblies, not saved templates or complete pages. Compatible local art overrides are explicit; no pairwise component-name compatibility system was introduced.

Registry now has **108 registrations / 73 Production**; Composition has **127 fixtures**. Approval ledger covers every E01–E12. Existing experimental→review→production engineering gates promote to v1.0.0 after current-pass evidence. Metadata records evidence model/scale/ideal range/integrity, content/media contract, typography/art compatibility, real motion/configuration, section/page usage, responsive/accessibility readiness and complexity. Page type metadata permits future testimonial/result/story/case/recognition uses without building pages.

## Verification results

Reproducible scripts: `scripts/design-engine-pass008-{qa,browser,interactions,lab,performance,visual}.mjs` and QA TSX. Browser harness bundles the real production renderer and Lab source on loopback; it does not add a production route or bypass staff authorization. Google Chrome / Playwright, local licensed fonts and native media are used.

| Check | Result / evidence |
| --- | --- |
| Full test suite | **1,063 tests, 66 files pass** (`npm test -- --maxWorkers=2`); 20 focused production evidence tests; `evidence/tests.log` |
| Typecheck | Pass, `npm run typecheck`; `evidence/typecheck.log` |
| Lint | Pass, zero errors/warnings, `npm run lint`; `evidence/lint.log` |
| Production build | Pass, `npm run build`; existing admin/Lab routes compile, `evidence/build.log` |
| Responsive layouts | **72**: all twelve × 1920/1440/1280/768/390/320; `layout.json` |
| Type/art/client matrix | **1,170** at mobile: ten typography profiles × compatible art directions × three contexts; `matrix.json` |
| Accessibility audits | **72 axe audits**, zero violations in tested scopes; two widths × three contexts × twelve; `audits.json` |
| Bounds/resilience | **144**: minimum/maximum counts, no media, large values × three widths × twelve; `bounds.json` |
| Mixed compositions | **48** rendered checks: 24 × desktop/mobile, valid headings/layers/source fixtures; `compositions.json` |
| E06 options | **108** rendered option cases at 1440/390/320; `e06Options.json` |
| E06 loop geometry | **40** style/width/direction cases all pass; `interactions.json` |
| Keyboard/motion/interaction | **30 checks pass**, including E05/E07/E08/E11 and six other source disclosures, E06 pause/focus/links/reduction/visibility/seam, E12 sequencing; no browser errors |
| Design/Composition Lab | **24 workflow checks pass**: all production previews, E06 hover/focus/rollback/commit, typed controls, composition choice/addition, none hides loop controls, preserved study view; `lab-workflow.json` |
| Overflow/media/console | **0 overflow findings, 0 media failures, 0 unexpected console/page errors** in the browser matrix; `browser-summary.json` |
| Visual evidence | Desktop/mobile screenshots of each system, four E06 styles, explicit resting screenshots and two E06 composition contexts; `visual.json` and PNGs |
| Caption refinement | **120** E11 type/art/width checks pass after widening the narrow exhibit-count caption; `refinements.json` |
| Study preservation | Seven SHA-1 checks pass, original source unchanged; `original-studies.sha1` |
| Performance/import audit | Isolated bundles and runtime observer/mutation checks above; `performance.json`, `interactions.json`; no production imports of creative studies |

Findings corrected during QA: inert moved from outer visual viewport to repeated track so hover pause works; publication/verified-purchase guards strengthened; surface styling also applies to static reading; E10 none avoids reveal hydration; E06 browser bundle excludes schema/reveal dependencies; the narrow E11 count caption retains complete words. A heavily concurrent full-suite attempt hit resource-contention timeouts (including an unrelated creative-service test); the unchanged timed-out tests and complete suite pass with two workers. No timeout relaxation or unrelated implementation change was required. The test suite's expected mocked redirect-error output is not a browser console failure.

Motion-in-progress screenshots can show temporary opacity; explicit resting screenshots supplement them for composition review. Checked local containment, evidence relationship labels, long-copy wrapping, attribution ownership, portrait ratios, native disclosures, focus and live OS reduction. The matrix found no neighboring background/width/sticky collisions in tested compositions. Brand/art rhythm changes remain deliberate; client-authored palettes and unbounded content outside the schemas are not covered.

## Collection 009 handoff

Created concise `ASTRA_CREATIVE_CONTEXT.md`: current inventory and evidence capabilities; independent ten type/six art layers; approved creative principles and structural constraints; sources/integrity and motion rules; useful mature neighbors; next Collection 009 Process / Methodology / How It Works requirements. It calls for meaningful sequence, decisions, responsibilities, deliverables, iteration/dependencies/optional paths and mobile/static reading, avoiding default numbered cards and decorative arrows. Historical notices in architecture, contribution, direction and tooling now have a superseding current-state notice. No 009 concepts were generated.

Future full pages, external review integrations, motion choreography, page transitions, nested pages, AI composition and automation remain clean extension points. Pass 008 ends here.
