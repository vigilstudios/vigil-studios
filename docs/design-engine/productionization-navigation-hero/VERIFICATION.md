# Navigation Expansion + Hero Expansion productionization

> **Scroll correction — 2 October 2026:** see [actual Lab scroll fixes and verification](SCROLL_FOLLOWUP.md) for smooth selected scroll transitions, native pinning at zoom, complete reveal surfaces, Hero transitions and hover dismissal.

> **Client preview follow-up:** Overlay Navigation hides the full-image Hero’s top reference line; all 15 Navigations expose brand treatment controls; all 96 catalog components and every Composition section expose client adaptations. Current regression: 842 tests / 64 files. Read [controls and current verification](CLIENT_PREVIEW_FOLLOWUP.md).

Completed 2 October 2026 in the existing Vigil Studios Design Engine. The user's brief explicitly approves NX01–NX12, modified H12, HX01 and HX02. All fifteen are Production v1.0.0. H12 retains `hero.comparison`; the other fourteen are new registrations. The inventory now contains 96 registrations, 61 Production systems and 103 Composition fixtures.

The complete requested implementation report is [CAPABILITIES.md](CAPABILITIES.md): every Navigation, independent alignment options, position/background/contrast/density/scroll/utility contracts, desktop/mobile/expanded behavior, H12 versioning, both Hero contracts, compatibility and safe areas, Lab integration, registry metadata and future boundaries. The source preservation checklist is [AUDIT.md](AUDIT.md). [registry.json](registry.json) is a snapshot of the actual new registrations and their SectionContracts.

## Systems delivered

| Source | Production ID | Architecture |
|---|---|---|
| NX01 Datum | `navigation.datum` | Baseline with destination disclosures |
| NX02 Meridian | `navigation.meridian` | Equal wings around a centered brand |
| NX03 Dispatch | `navigation.dispatch` | Publication masthead and destination register |
| NX04 Pocket Dock | `navigation.pocket-dock` | Floating launchpad with attached index |
| NX05 Viewfinder | `navigation.viewfinder` | Scene signature and cinematic side menu |
| NX06 Switchboard | `navigation.switchboard` | Utility band and department band |
| NX07 Atlas Hall | `navigation.atlas-hall` | Directory gate and grouped hall |
| NX08 Folio Takeover | `navigation.folio-takeover` | Colophon and fullscreen editorial index |
| NX09 Margin Rail | `navigation.margin-rail` | Reserved page margin and vertical register |
| NX10 Threshold | `navigation.threshold` | Entrance signature and post-Hero destination shelf |
| NX11 Channel Directory | `navigation.channel-directory` | Department selector and staged child directory |
| NX12 Open Doors | `navigation.open-doors` | Oversized destination board |
| Modified H12 | `hero.comparison` | Compact context and interactive registered image seam |
| HX01 Full Scene | `hero.full-scene` | Grouped introduction over continuous full viewport media |
| HX02 Scene Poster | `hero.scene-poster` | Independent headline with a separate lower context register |

Each Navigation has its own header module. Shared primitives handle disclosure/panel mechanics, semantic destinations, native modal focus, Escape, staged focus restoration, safe logo fallback and scroll state. HX01/HX02 have separate rendering modules and share only lower-level media/action primitives. Creative originals remain in Collection 003B and Hero Expansion.

## Final verification

| Gate | Result | Evidence |
|---|---|---|
| Full regression suite | **660 tests / 63 files pass** | [tests.log](evidence/tests.log) |
| Typecheck | **Pass** | [typecheck.log](evidence/typecheck.log) |
| ESLint | **Pass, no warnings** | [lint.log](evidence/lint.log) |
| Optimized Next production build | **Pass** | [build.log](evidence/build.log) |
| Responsive and composition layouts | **552 cases pass** | [layout.json](evidence/layout.json) |
| Edge capabilities, content, media and touch | **105 checks pass** | [edges.json](evidence/edges.json) |
| Keyboard/menu behavior | **25 checks pass** | [interactions.json](evidence/interactions.json) |
| Automated WCAG A/AA audits | **45 audits, zero reported violations** | [audits.json](evidence/audits.json) |
| Scroll/reduced motion | **48 checks pass** | [motion.json](evidence/motion.json) |
| H12 native range in three alignments | **Pass** | [capabilities.json](evidence/capabilities.json) |
| Design and Composition editor workflows | **9 workflow checks pass** | [lab.json](evidence/lab.json) |
| Unexpected browser runtime/console errors | **Zero** | [errors.json](evidence/errors.json), [failures.json](evidence/failures.json) |
| Isolated Navigation dependency review | **37,095 minified bytes / 13,218 gzip bytes** | [performance.json](evidence/performance.json) |

### Layout and brand coverage

The browser matrix covers all twelve Navigations at 1920, 1440, 1280, 1024, 768, 390 and 320 pixels with long labels/brand/copy. Each Navigation is exercised over all ten available Heroes in Hero-centric overlay mode. Additional cases use Editorial/Publication, Technical/Precision, Fashion/Runway, Brutalist/Billboard and Humanist/Salon profiles; text, short wordmark, long wordmark, symbol, symbol+wordmark and image logos; every HX alignment × vertical placement × voice × ink combination at desktop/mobile/narrow mobile; and existing Primary/Island/Contents Navigation with both new Heroes.

Mixed compositions exercise production Story, Work, Services and Commerce systems from Collections 004–007. The original Composition fixtures remain, plus twelve new Navigation/Hero fixtures. Assertions check document/element overflow, loaded images, measured safe insets and unobscured Hero headings. Desktop and mobile screenshots for every Navigation are in `evidence/`.

The 105 supplemental checks confirm physical layout changes for every variable Navigation alignment, all four Pocket Dock treatments across three docking alignments/two widths, zero/two/three priority destinations, optional CTA/utility visibility, actual transparent-to-solid paint for all dock treatments, compact geometry without content displacement, compact invariance under reduced motion, broken-logo text fallback and recovery with a later valid source for all twelve systems, and both Heroes with short/long/missing metadata, zero/two actions and portrait/panoramic media. Touch-emulated mobile menus retain scrolling, staged traversal, Escape and trigger focus restoration.

### Interaction, contrast and editor coverage

Keyboard checks cover native disclosures, modal containment, menu dismissal and focus restoration. Channel Directory moves focus to the child heading and returns to the selected parent on Back. Expanded menus retain page geometry and scroll internally. Automated audits include resting desktop/mobile states, expanded states and missing Hero metadata. Reduced-motion checks verify visible reveal headers without running animation; Hero scenes remain static.

Scroll assertions verify downward hiding/upward revealing, Hero exit detection, sticky behavior and reduced-motion invariants. Actual scroll ancestors are discovered so editor preview scrolling is supported. Header geometry is measured with ResizeObserver and compensates for preview zoom; compact paint retains the original reservation. Rail responsiveness reads page width rather than the narrow rail column. Floating safe inset includes its authored offset. Threshold's shelf follows the selected Hero without coupling to a specific Hero implementation.

The Lab workflow selects every new Production registration, confirms Meridian's centered brand remains fixed, changes independent Datum alignment and the coupled Hero-centric overlay mode, adjusts H12 alignment without resetting the native range, opens both original creative workspaces, replaces Navigation/Hero in Composition, applies Hero alignment, displays mobile-only capability explanations, and opens/dismisses the Composition mobile menu. Screenshots: [Design Lab H12](evidence/design-lab-h12.png), [Composition Lab](evidence/composition-lab.png).

Explicit HX ink conflicts produce a compatibility reason; inherited opening ink follows the Hero's classified ink. Arbitrary client photographs still require authored contrast review. Automated accessibility checks supplement semantic/keyboard/layout testing; they do not certify arbitrary future client content or every browser/device.

### Regression and performance decisions

New production tests enforce source-to-production capability preservation, strict control/IA/utility/destination validation, all new Navigation/Hero compatibility, H12 backward payload/default alignment/versioning, and HX placements/actions/media semantics. Existing inventory/lifecycle assertions now reflect deliberate promotions. The exhaustive profile render regression is parameterized per registered section, retaining every declared combination while preventing one growing inventory loop from exceeding a single test's timeout.

Performance review confirms no schema parser, preview module or study asset in the isolated Datum browser bundle. Its reported size includes React and shared primitives, not a promise about a complete deployed application's transfer size. Scroll work uses one passive, animation-frame-throttled listener per mounted Navigation; observers/listeners clean up on unmount. HX rendering adds no menu state, continuous animation, autoplay, media preloading service or dependency. Existing media primitives handle authored intrinsic sizes/focal/mobile crops.

## Reproduction and scope

Run the normal repository gates: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. Browser scripts are `scripts/design-engine-navigation-hero-qa.mjs`, `design-engine-navigation-hero-browser.mjs`, `design-engine-navigation-hero-edges.mjs` and `design-engine-navigation-hero-lab.mjs`. The QA builder emits only a disposable `/tmp/vigil-navigation-hero-qa` bundle served on loopback port 4190; Playwright and axe locations can be supplied through `PLAYWRIGHT_MODULE` and `DESIGN_ENGINE_AXE`.

Browser evidence uses headless Chrome with actual production components and the actual source Lab editors, including their editor scaling/scroll containers. Mobile touch is emulated; no physical-device/Safari certification is claimed. The staff-gated Next routes compile in the production build. No application authentication bypass or public QA route was introduced.

No meaningful implemented approved capability was omitted. Future study proposals for video, arbitrary-depth IA, hinges/3D folding, staggered entry and new Motion Engine behavior remain future work; the exact reasons and structural invariants are documented in CAPABILITIES.md. Client media registration/contrast and host-specific links/optimization remain authored inputs.

Pre-existing repository work is preserved. No dependency changes, commits, deployment, Collection 008, page recipes, route generation, client automation or Scar changes were made. This pass stops here.
