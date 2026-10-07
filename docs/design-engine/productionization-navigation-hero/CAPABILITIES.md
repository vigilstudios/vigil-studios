# Production Navigation and Hero capabilities

> **Scroll correction — 2 October 2026:** see [actual Lab scroll fixes and verification](SCROLL_FOLLOWUP.md) for smooth selected scroll transitions, native pinning at zoom, complete reveal surfaces, Hero transitions and hover dismissal.

> **Client preview follow-up:** Overlay Navigation hides the full-image Hero’s top reference line; all 15 Navigations expose brand treatment controls; all 96 catalog components and every Composition section expose client adaptations. Current regression: 842 tests / 64 files. Read [controls and current verification](CLIENT_PREVIEW_FOLLOWUP.md).

2 October 2026. All twelve approved Navigation Expansion systems and both expanded Heroes are first-class Production v1.0.0. Modified H12 also becomes Production v1.0.0, retaining its existing ID. Inventory: 96 registrations, 61 Production, 103 Composition QA fixtures.

Creative studies remain under Collection 003B and Hero Expansion and are labelled Creative Study. Production Systems are discoverable in the normal catalog and Composition. The user's productionization brief supplies the current HX01/HX02/H12 approval; older pending-review records remain historical.

## Navigation inventory

Alignments are independent settings.brand, settings.primary and settings.actions. Fixed values are structural properties. Unsupported values fail strict parsing; the Labs derive choices from SectionContract.configuration.

| Concept / stable ID | Brand | Navigation | Actions | Position | Density | Utility whitelist | Scroll |
|---|---|---|---|---|---|---|---|
| NX01 Datum / navigation.datum | left | left, center, right | right | flow, overlay | comfortable, compact | cta | static, sticky, reveal, solidify |
| NX02 Meridian / navigation.meridian | center | split | left, right | flow, overlay | comfortable, compact | cta, locale | static, sticky, reveal, solidify |
| NX03 Dispatch / navigation.dispatch | left, center | left, center | right | flow, overlay | comfortable, compact | cta, search, utility-links | static, compact, sticky, reveal, solidify |
| NX04 Pocket Dock / navigation.pocket-dock | left | left | right | floating | comfortable, compact | cta, search, locale | static, sticky, reveal, solidify, compact |
| NX05 Viewfinder / navigation.viewfinder | left | right | right | overlay, flow | comfortable | cta | solidify, static, sticky, reveal |
| NX06 Switchboard / navigation.switchboard | left | left, center | right | flow, overlay | compact | cta, search, account, cart, locale | static, sticky, reveal, solidify |
| NX07 Atlas Hall / navigation.atlas-hall | left | left | right | flow, overlay | comfortable, compact | cta, search, utility-links | static, sticky, reveal, solidify |
| NX08 Folio Takeover / navigation.folio-takeover | left, right | left | right | flow, overlay | comfortable | cta, utility-links | static, sticky, reveal, solidify |
| NX09 Margin Rail / navigation.margin-rail | left | left | left | edge | comfortable | cta | static, sticky, reveal, solidify |
| NX10 Threshold / navigation.threshold | left, center | split | right | flow, overlay | comfortable | cta | static, sticky, reveal, solidify |
| NX11 Channel Directory / navigation.channel-directory | left | left | right | flow, overlay | comfortable, compact | cta, search | static, sticky, reveal, solidify |
| NX12 Open Doors / navigation.open-doors | left, center | split | right | flow, overlay | comfortable | cta | static, sticky, reveal, solidify |

Each system has an independent header module and chooses an appropriate shared panel primitive. There is no generic structural Header switch. Shared NavigationShell owns disclosure/modal state, dismissal, logo fallback, safe destination rendering, staged focus and one passive/rAF scroll listener for its actual scroll ancestor. Each Composition can contain one Navigation.

### NX01 · Datum

A wordmark signs the left margin; a single baseline of destinations has its own alignment. One-level disclosures keep a small site legible.

Desktop: One calm baseline with a distinct action at the end.

Mobile: Anchored index beneath the brand; child groups expand inside the overlay without moving the page.

Expanded: Anchored per-destination disclosures; compact mobile overlay index.

Content: 3–5 parent destinations; each can have up to six child destinations. 3–5 destinations; one child level. Long words wrap; do not add utility rows.

### NX02 · Meridian

The brand is the hinge between two equal navigation wings. Actions live on a separate small service line.

Desktop: Two balanced link groups orbit a centered wordmark; the logo never moves off the axis.

Mobile: Centered brand above two visible priority destinations and a bottom sheet for the full hierarchy.

Expanded: Per-link desktop disclosures; mobile two-column sheet.

Content: 4–8 parent destinations; each can have up to six child destinations. Even split is preferred; broad image marks cap at 14rem. CTA never competes with the center.

### NX03 · Dispatch

A publication masthead separates identity, edition context and a ruled destination register. Reading hierarchy takes precedence over header economy.

Desktop: Large wordmark and colophon above a full-width section rail.

Mobile: Small masthead, two priority sections and a numbered editorial index sheet with expandable departments.

Expanded: Section disclosures and a numbered mobile index.

Content: 5–8 parent destinations; each can have up to six child destinations. Flow or overlay; compact state reduces brand scale but keeps every destination reachable. Avoid another full masthead immediately below.

### NX04 · Pocket Dock

A small signed launchpad holds only the current context and menu control; opening creates an adjacent destination fan with equal touch targets.

Desktop: Detached dock with optional priority routes; the full index opens in an attached overlay.

Mobile: Reachable compact launcher with an attached vertical sheet; no fixed bottom bar obstructing browser chrome.

Expanded: Nonmodal fan of individually numbered destinations.

Content: 3–5 flat destinations. No nesting. True zero-footprint floating across every Hero. Choose dock position, width, visible links and text contrast to suit the opening.

### NX05 · Viewfinder

Identity and a framed menu trigger occupy opposite corners of a media-safe band. The revealed menu leaves a deliberate window onto the Hero.

Desktop: Corner wordmark, scene caption and discreet frame trigger; opaque panel occupies only the right half when opened.

Mobile: Full-height scene index with large destinations and a persistent close control.

Expanded: Cinematic side sheet on a solid surface; author header text contrast for the selected Hero.

Content: 3–5 flat destinations. Hero-centric mode has no background until the measured Hero leaves view. Author light/dark text contrast for the image; panels always retain a solid surface.

### NX06 · Switchboard

A compact utility band carries task controls while a separate high-contrast destination band carries the site map. Identity belongs to the utility band.

Desktop: Utility/identity row above a dense, clearly named department row.

Mobile: Search remains a direct control; departments open as accordions inside the overlay with utility actions after them.

Expanded: Hierarchical destination disclosures with persistent utility access.

Content: 5–8 parent destinations; each can have up to six child destinations. Maximum two levels; commerce/account/locale are labelled presentation previews. No account or basket state.

### NX07 · Atlas Hall

A directory gate opens a full-width hall of grouped destinations beside an authored orientation note. The taxonomy, not promotional cards, determines columns.

Desktop: Brand, two priority routes and an explicit directory control; grouped mega panel reveals the full architecture.

Mobile: Single-column directory with independently expandable groups and visible parent destinations.

Expanded: Wide grouped overlay disclosure; no hover-only access.

Content: 5–8 parent destinations; each can have up to six child destinations. 5–8 groups with at most 6 children each. Mega panel overlays the page in its own stacking layer; the menu scrolls internally when needed.

### NX08 · Folio Takeover

A sparse colophon opens a full-screen typographic index. Oversized parent destinations and a quieter companion column create a deliberate reading sequence.

Desktop: Small signature and labelled Index control; open state dedicates the viewport to navigation.

Mobile: Editorial full-screen index, expandable child routes and a close control kept at the top of its scroll surface.

Expanded: Native modal dialog; parent/child hierarchy, inert background and focus restoration.

Content: 5–8 parent destinations; each can have up to six child destinations. No mega-menu density; eight parent destinations maximum. Longer indexes scroll inside the modal.

### NX09 · Margin Rail

A narrow vertical rail owns a separate page margin. A symbol leads a numbered vertical route register while the Hero occupies the remaining field.

Desktop: Left rail with symbol/wordmark, vertical index and bottom action; Hero gets an explicit reserved column.

Mobile: Rail becomes a top strip plus a labelled full-height side drawer; no sideways labels or hidden edge gestures.

Expanded: Modal side drawer on narrow artboards; desktop destinations remain visible.

Content: 3–5 flat destinations. Requires a composition wrapper reserving 13rem. Incompatible with full-bleed page chrome or independently sticky left rails.

### NX10 · Threshold

The brand signs the entrance to the Hero; primary destinations form a broad threshold immediately after the opening scene. Navigation and image share a frame, not a component.

Desktop: Small opening signature and menu shortcut, then Hero, then a full-width numbered destination shelf.

Mobile: Top shortcut opens an overlay index above the Hero; the post-Hero shelf becomes generous stacked destinations.

Expanded: Overlay index keeps navigation available before the Hero has been traversed.

Content: 3–5 flat destinations. Flow or overlay header; shelf belongs to navigation and follows any selected Hero. Do not repeat the Hero CTA in the shelf.

### NX11 · Channel Directory

A vertical department selector controls an adjacent detail directory. Parent overview links remain separate from buttons that select their children.

Desktop: Compact signed header opens a two-pane capability browser with context for the selected department.

Mobile: Staged drilldown: choose a department, enter its destinations, return with an explicitly labelled Back button.

Expanded: Selected department and child directory; buttons use aria-pressed, not incomplete ARIA tabs.

Content: 5–8 parent destinations; each can have up to six child destinations. One child level, 5–8 departments. Not appropriate for flat three-link sites. Staged mobile focus moves to the child heading and back to the chosen department.

### NX12 · Open Doors

Three to five large labelled doors each own a destination and an ordinal. A compact signature opens or folds the entire entry board, with no conventional link rail.

Desktop: Signature above an expandable horizontal board of oversized destinations; unequal door proportions express priority.

Mobile: Two-column board with the first destination spanning both columns, maintaining priority and generous touch areas.

Expanded: All destinations reveal in a graphic board rather than a list or megamenu.

Content: 3–5 flat destinations. Flat IA only. Long labels wrap inside doors. No mandatory imagery, ornamental arrows or hover-dependent navigation.

## Navigation configuration/data contract

- settings.brand/primary/actions model independent structural regions. Meridian's brand stays centered and its primary destinations remain split. Datum and Dispatch align their destination rails, Folio reverses identity/trigger order, and Threshold/Open Doors rearrange their signed entrance. These are different DOM architectures, not one CSS alignment toggle.
- settings.position preserves flow, overlay, floating and edge only where declared. Background is the approved solid surface. Hero-centric scroll deliberately removes that surface over the Hero; scrim/always-transparent modes were removed from the approved follow-up before this pass and are not reintroduced.
- settings.contrast: brand, light-on-dark, dark-on-light where declared. Viewfinder fixes light-on-dark. Brand reads the client tokens; explicit contrast surfaces use neutral, guaranteed opposing inks. settings.heroContrast owns the transparent opening independently of the solid state. Full Scene/Scene Poster classify inherited opening ink from their ink field; other Heroes show an authoring notice for actual content/image contrast. No automatic image-analysis service is implied.
- settings.scroll: static, sticky, reveal, solidify on all twelve. Dispatch and Pocket Dock additionally compact. Selecting solidify changes flow to overlay atomically; selecting flow changes solidify to sticky. Floating and edge retain their footprint. Reveal stays visible under OS reduced motion and returns on focus, expansion or upward movement. Selected scroll policies remain smoothly animated at entrance intensity none. OS reduced motion removes interpolation; reveal stays visible and compact retains full chrome.
- Pocket Dock: capsule/frame/glass/segmented; left/center/right docking; compact/wide width; close/relaxed offset; none/two/three priority routes; independent CTA/utility visibility. All four surfaces become opaque after Hero exit. Priority routes move into the mobile menu; the Labs explain that desktop-only control.
- content.brand supports up to 120 characters. content.logo accepts text, wordmark, authored symbol image, symbol+wordmark image, or image with intrinsic dimensions. Missing logo data uses the wordmark; failed assets fall back to the brand text. A later valid source recovers without remounting. No fixture symbols/assets are imported by production components.
- content.links carries safe semantic destinations with labels <=80; flat systems reject children, nested systems support one child level. Parents keep their own destination in disclosures/directories. No generated paths, route framework, commerce/account state or search service.
- content.action and content.utilities are optional semantic links. Each utility entry declares its whitelisted kind and host-owned href. Utility kinds and parent labels must be unique. Hidden slots render nothing; missing action/utility data hides corresponding Composition controls. CTA is capped by the architecture; account/cart/locale remain presentation-ready. No social capability was present in the approved studies.
- Optional kind, edition, note, sceneLabel and prompt replace study-only colophon/context strings. All mobile menus preserve semantic order, internal scrolling, Escape and focus restoration; modal systems contain focus, staged Directory focuses its selected heading and restores its parent on Back. No core route requires hover.

## Hero systems

| System | Structure | Controls | Media / content |
|---|---|---|---|
| Registered Comparison / H12, hero.comparison v1.0.0 | Matched pair, visitor-controlled seam, 22rem compact context | balanced/inspection initial seam; independent left/center/right context; native range, step, reset | Registered full-bleed image pair with matching ratios/focals; natural/monochrome/high-contrast; eyebrow/title/body, labelled states, one CTA |
| Full Scene / HX01, hero.full-scene v1.0.0 | Grouped title/context/actions over one continuous scene; edge provenance | left/center/right × top/middle/bottom; subtle/loud voice; light/dark ink | Full-bleed cover image, intrinsic dimensions, alt, focal/mobile crop, optional mobile source/srcset/sizes; optional metadata/body and zero/one/two actions |
| Scene Poster / HX02, hero.scene-poster v1.0.0 | Independent headline field; separate bottom context register across exposed photograph | Same nine headline placements and voice/ink choices; context follows headline alignment | Same image contract; bottom register stacks on mobile; optional caption/body/actions do not create empty controls |

H12 intentionally supersedes the previous review implementation. Its existing ID, balanced/inspection payloads, labels, matched-image validation, range/step/reset behavior and default left placement are preserved. No duplicate Hero is created. H12's compact panel was already in the repository at task start; this pass formalizes and promotes it rather than reverting that approved change.

HX01 and HX02 have separate server-renderable modules; only image/metadata/action primitives are shared. They consume semantic display/body/mono roles and all ten typography/six art-direction profiles. Art direction changes gutters and copy rhythm while preserving grouped versus separate reading structures. Client brand tokens govern neighboring surfaces/actions; deliberate photographic light/dark ink remains a protected readability layer. Long content grows the scene instead of clipping. Scenes use 100svh by default; hosts may supply --de-scene-viewport for a bounded preview. Motion is none: no client state, autoplay, scroll capture, extra media preload or new Motion Engine behavior.

## Compatibility and safe-area architecture

CompositionGeometry measures closed header height through ResizeObserver, compensates for editor zoom, and exports --de-navigation-height / --de-overlay-inset. New Navigation exposes its measured --de-nx-header-height. Expanded panels have zero layout footprint. Flow reserves its closed height; sticky regions keep the same reserve while compact paint changes. Overlay/floating reserve no document row, and the Hero receives the measured top safe inset. Floating inset also includes its actual dock offset. No Hero guesses a header's pixel height.

The shared contract accepts each new Navigation with all ten Heroes using declared Hero surface capabilities. Transparent ink conflicts against classified HX ink produce a visible compatibility reason; unspecified image/surface contrast gets an authoring notice. Existing Island overlay rules remain in force. Margin Rail reserves its own 13rem structural page column at desktop and becomes top chrome at narrow widths; its responsive queries read the page width, not the narrow rail width. Threshold's shelf is rendered after whichever Hero is selected and before Collections 004–007. Native dialogs use the top layer; nonmodal panels/disclosures stack above all Hero/body sections and scroll internally.

## Controls, extension points and limitations

Production metadata and strict schemas use the existing SectionContract, registry validation, section inspector, preview resolver and Composition validation. No parallel pairwise compatibility matrix or route engine. Creative and production workspaces remain separate. Design and Composition expose supported values only; singleton invariants are properties; irrelevant transparent ink/CTA/utilities are hidden; mobile priority/width/alignment differences receive explicit explanations.

Every meaningful currently implemented study capability is represented. The previously ineffective NX04 utility visibility control now renders real optional search/locale slots. Future proposal text (door hinges/3D folding, future stagger/pane animation, video and arbitrary depth) is not implemented approved behavior, so it is retained as a future boundary rather than claimed as production capability. Video would require its own speech/transcript/caption, playback, crop and loading contract; the approved HX studies demonstrate images only. Full-bleed cover geometry and continuous photographic background are structural invariants; generic media-fit/background/density controls would undermine those approved structures. There are no silently removed implemented capabilities.

Client image contrast, source registration for H12, licensed fonts and host image optimization remain author-owned inputs. Production links require safe schemes; image/logo sources reuse the existing mediaSourceSchema. Performance: rAF-throttled passive scroll, state updates only on threshold/direction changes, observed local geometry, listener/observer cleanup, native disclosures/dialog, static HX rendering, no polling/continuous animation, no new dependency or global font preload.

Read [audit/checklist](AUDIT.md) and [verification](VERIFICATION.md) for current-pass evidence. No Collection 008, page recipes, route generation, client automation, deployment or Scar changes.
