# Navigation scroll behavior correction

2 October 2026. Updated after the second scroll report to cover in-flight behavior, not only settled endpoints. Follow-up to the user's report that navbar scroll effects were not behaving correctly.

The actual Design Lab reproduced a pinned navbar moving out of view as the canvas scrolled. Several independent problems combined:

- The outer DesignThemeProvider used `overflow: hidden`, which created a non-scrolling ancestor that captured CSS sticky positioning. The foundation now uses `overflow: clip` to retain artwork clipping without creating that scroll container. [MDN's overflow reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow) documents this distinction.
- Navigation treated the local `motion="none"` intensity as OS reduced motion. Every production Navigation's entrance behavior is fixed none, so its default Lab layers suppressed the separately selected hide/reveal and compact policies. MotionPolicy now exposes OS reduction separately. Navigation uses that for its accessibility fallback. A selected scroll policy now owns its transition timing independently of decorative/entrance motion none; OS reduction alone removes interpolation. The previous follow-up left these transitions instantaneous, which was incorrect.
- A transformed artboard moves CSS sticky coordinates as its zoom changes. The earlier inverse-scale inset corrected only the settled coordinate and lagged during scrolling. LabEditor now uses native [CSS zoom](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/zoom), preserving the authored container width and pinch anchor while letting the browser pin sticky chrome directly. The per-scroll sticky style write is removed. Only the Composition region owns pinning; the inner Navigation slot remains relative.
- The individual Navigation preview contained too little content to scroll beyond its full-image Hero. Its existing Feature List mechanism now supplies approach, process and contact sections, giving the preview an actual body context for the transparent-to-solid transition.
- Hidden authored canvases must not update their geometry/direction state while a temporary audition is displayed. Measurements skip hidden branches, visibility restoration refreshes the applied navbar, and PreviewCanvas restores the saved scroll position after the editor's scaled height reservation catches up. Component/demo changes reset that saved context.

The flow spacer and theme wrapper previously painted a second stationary background behind the translated header. These Navigation wrappers are now transparent; the moving header owns the surface, borders and shadow. Reveal has a 320ms transform transition with accumulated direction thresholds (12px down / 8px up), avoiding both skipped slow scrolling and reversals from small trackpad jitter. Compact interpolates padding, masthead type/mark scale and colophon collapse, retaining the original content reservation and using a 72px / 56px hysteresis. Solidify interpolates its surface, ink, border, shadow and Switchboard band (a focused band check captured 18 distinct intermediate colors). Keyboard focus restores reveal immediately.

No scroll configuration values, structural identities, client data schemas, creative approvals or lifecycle statuses changed.

## Resulting behavior

- **Static:** remains in its authored flow/overlay position and leaves the viewport with the page.
- **Sticky:** pins to the real scrollport throughout the page, preserving Floating's offset and Margin Rail's reserved column.
- **Reveal:** hides on downward movement and returns on upward movement, focus or expansion. Margin Rail exits horizontally on desktop and vertically as top chrome on mobile. OS reduced motion keeps it visible.
- **Compact:** Dispatch and Pocket Dock reduce their chrome after the local threshold, with the original page geometry reserved. OS reduced motion retains full chrome; the selected compact transition remains smooth at authored motion none.
- **Solidify:** remains transparent while its Hero occupies the top of the scrollport, becomes opaque after Hero exit, and returns to transparent when scrolling back. Without a Hero it uses its solid surface.

The implementation keeps passive scroll listeners, requestAnimationFrame batching and observer/listener cleanup. It adds no animation system, dependency, route, public QA endpoint or deployment.

## Verification

**Correction after the reveal-only report:** the earlier matrix below ran against an esbuild source harness, not the authenticated Next development route. It did not catch stale CSS served by Next's nested stylesheet import. The live-route checks in the reveal-only follow-up below supersede those results for this issue.

The actual-source loopback harness tests all twelve systems in both Labs and the window-scrolling production composition. The focused Lab scripts check visible coordinates/backgrounds and compact height, rather than accepting state flags alone. `scripts/design-engine-navigation-scroll-frames.mjs` additionally samples intermediate animation frames, immediate pin coordinates before JavaScript can correct them, every painted wrapper, slow scrolling, direction reversal and threshold jitter across supported positions. Solidify belongs to overlay/floating/edge; the existing contract converts flow to overlay for that policy, so flow/solidify is excluded from the supported-combination matrix. It also covers default motion none, OS reduction, focus recovery, immediate re-pinning on zoom, preview dismissal, reveal-direction retention and end-of-page scroll restoration after a shorter audition.

- Full suite: **842 tests / 64 files**; typecheck, lint and optimized build pass. The current smoothness gate logs use the `scroll-smooth-` prefix in [evidence](evidence/).
- Production run: **552 layouts, 25 keyboard/menu checks, 45 accessibility audits and 48 scroll/reduced-motion checks** pass, with zero reported failures. The production browser script now also rejects visibly unpinned sticky/solidify states.
- Existing customization regression: **40 focused hover/focus checks** pass after the scroll fixes. **28 editor workflow checks** pass, including pinch/Ctrl-wheel/Cmd-wheel zoom, pointer-anchor retention, ordinary wheel pan, touch application and an editor accessibility audit.
- Lab endpoint matrix: **353 checks, zero errors**. Current results are recorded in [scroll-lab.json](evidence/scroll-lab.json) and [the smoothness run log](evidence/scroll-smooth-settled.log). Reproduce with `scripts/design-engine-navigation-scroll-browser.mjs` against the source Lab harness.
- In-flight frame matrix: **406 checks, zero errors** (110 static, 110 sticky, 110 reveal, 60 solidify, 15 compact and one OS-reduction scenario). Current results are recorded in [scroll-frames.json](evidence/scroll-frames.json) and [the current run log](evidence/scroll-frames-current.log). Reproduce with `scripts/design-engine-navigation-scroll-frames.mjs`. The matrix covers every supported position/policy across all twelve systems, three desktop Design zooms, Composition Fit and mobile Composition.

These are headless Chrome checks with emulated mobile artboards; they do not claim physical-device or Safari certification. Staff-gated Next routes compile unchanged. The original endpoint evidence is historical; the frame matrix and smoothness logs record the follow-up.

## Reveal-only live-route correction

The authenticated `/admin/lab?workspace=composition` route still served older `expansion.css` rules through the nested stylesheet import: computed header transition was `none`, the system wrapper painted an opaque background, and the inner slot remained sticky. The source harness loaded newer rules, explaining why its previous results did not match the user's app.

`NavigationShell` now directly imports a colocated `reveal.css`, with rules scoped to `data-scroll="reveal"`. The selected behavior has a 380ms transform transition even when decorative motion is none. Both wrappers remain transparent, the inner slot is relative, and the complete painted header moves together. Focus recovery and OS reduced-motion fallbacks remain immediate. Other scroll policies are outside this correction.

Verified through the actual authenticated Chrome Lab with native/key scrolling on Datum and Meridian, each in flow and overlay. Computed styles confirm transparent wrappers, relative slots and the 380ms transition. Read-only observations captured real intermediate transforms: Datum flow at -15.9221px, Datum overlay return at -0.717729px, Meridian flow return at -219.692px and Meridian overlay return at -187.348px. Settled Meridian overlay is -250.396px when hidden and 0px when returned. Screenshots confirm no remaining stationary navbar surface.

Typecheck, focused ESLint, production build and 123 existing Navigation/Composition tests pass. These live checks cover two representative systems in the current desktop Chrome app; they do not imply a fresh all-system or physical-device certification.

## Solidify fade refinement

The selected solidify interaction now directly imports scoped fade rules: background, ink, border and shadow interpolate for 320ms in either direction at Hero exit/re-entry. The Switchboard band uses the same fade timing. Transparent wrappers leave the Hero visible beneath the fading header. Decorative motion none does not suppress this interaction; OS reduced motion retains immediate changes.

Verified in the authenticated Next Lab on Meridian in a long composition: 17 distinct background colors on Hero exit and 11 on re-entry, including partial alpha values and both settled endpoints. [Live samples](evidence/solidify-live-fade.json) and [an intermediate frame](evidence/solidify-live-fade.png) record the check. Focused lint and the production build/typecheck pass. No scroll thresholds, schema or customization controls changed.
