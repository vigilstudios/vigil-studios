# Collection 003B · Navigation Expansion

> **Current status:** all twelve approved systems now have separate Production v1.0.0 registrations and Composition integration. The original studies below remain intact as references. See [production capabilities](../productionization-navigation-hero/CAPABILITIES.md) and [verification](../productionization-navigation-hero/VERIFICATION.md).

Status: **all twelve studies creatively approved by the owner.** Approval and desktop behavior refinements recorded 2 October 2026 (America/New_York). Production promotion remains a separate step.

**Current contract and verification:** [Approval follow-up](APPROVAL_FOLLOWUP.md). Every study now supports sticky, reveal and Hero-centric motion across eight Heroes; dropdowns overlay without shifting content; NX04 has expanded floating controls and is a priority direction. Mobile refinement is deferred.

The numbered assessment below preserves the original 1 October proposal and its pre-review shortlist. Its pending-review wording, Hero restrictions, scroll lists, flow-panel descriptions and lower NX04 ranking are historical and superseded by the approval follow-up.

Open the existing /admin/lab → Design → **Collection 003B · Navigation Expansion**. Study selects the concept, brand, 1440/1024/768/390/320px artboard, production Hero, logo treatment and resilience case. Open the menu in the artboard for its expanded state. Contract and Review tabs contain constraints and recommendations. Scroll inside the artboard for scroll states. Compare twelve studies gives a compact structural overview; inspect individual studies at desktop width for final judgment.

## 1. Existing Navigation assessment

Repository code, registry, CREATIVE_DIRECTION.md, historical Collection 001 navigation records, production composition contracts, typography/art-direction profiles, icons, MotionPolicy and Collections 003–007 were inspected. Historical Figma-only concepts below are assessed from retained concept specifications; no new Figma inspection is claimed.

| Existing system | Assessment | Lifecycle / disposition |
|---|---|---|
| Primary Navigation | Useful baseline for flat conventional sites. Visually underdeveloped beside later collections: fixed brand/link relationship, text-only brand and generic mobile disclosure. Calmness is useful but cannot carry the small-site category alone. | experimental; preserved |
| N01 Hoverline → Floating Island | Strong compact identity: opaque island, two immediate destinations and dismissible panel. Center/end variants move the island, not independent brand/link/action slots. No nested IA or branded-asset contract. | review; preserved |
| N02 Contents / 001 → Contents Sheet | Strong typographic index with native dialog and secondary note. Runtime is a flat list; density, brand representation and grouped destinations are limited. | review; preserved |
| Historical N03 Veil / Frame | Useful media-aware intent, with contrast/safe-zone handoff still a proposal. NX05 supplies a working guaranteed-contrast proof without promoting N03. | Historical concept retained |
| Historical N04 Atlas / Domains | Valuable hierarchy and staged-mobile intent. NX07 and NX11 separate simultaneous taxonomy from selected-department browsing rather than treating them as cosmetic mega-menu variants. | Historical concept retained |

There are three selectable implementations, but the registry does **not** label them Production. None is wholly redundant. Nothing was removed or redesigned. Folio Takeover and Pocket Dock overlap existing families and are therefore lower expansion priorities. A generic one-row bar would not meet the current creative standard as the sole navigation vocabulary.

## 2–8. Concepts, IA scale, alignment, Hero compatibility, desktop/mobile, utilities and scroll

NX IDs avoid collisions with historical N01–N04. These are review-local typed contracts and interactive studies, not production SectionIds. Nested IA means parent destinations plus one child level; it does not imply arbitrary recursion or generated routes.

### NX01 · Datum

A wordmark signs the left margin; a single baseline of destinations has its own alignment. One-level disclosures keep a small site legible.

| Capability | Declared behavior |
|---|---|
| Scale | Small · 3–5 destinations · parent + child hierarchy |
| Alignment | brand: left; primary: left, center, right; actions: right |
| Position / surface | flow / solid |
| Contrast / density | brand, light-on-dark, dark-on-light / comfortable, compact |
| Desktop | One calm baseline with a distinct action at the end. |
| Mobile | Inline fold beneath the brand; group children expand in document flow, with no modal takeover. |
| Expansion | Anchored per-destination disclosures; compact inline mobile index. |
| Optional utilities | cta |
| Scroll | static, sticky, reveal |
| Constraints | 3–5 destinations; one child level. Long words wrap; do not add utility rows. |
| Three typography profiles | editorial / poster / technical |
| Three art directions | publication / billboard / precision |

### NX02 · Meridian

The brand is the hinge between two equal navigation wings. Actions live on a separate small service line.

| Capability | Declared behavior |
|---|---|
| Scale | Standard · 4–8 destinations · parent + child hierarchy |
| Alignment | brand: center; primary: split; actions: left, right |
| Position / surface | flow / solid |
| Contrast / density | brand, light-on-dark, dark-on-light / comfortable, compact |
| Desktop | Two balanced link groups orbit a centered wordmark; the logo never moves off the axis. |
| Mobile | Centered brand above two visible priority destinations and a bottom sheet for the full hierarchy. |
| Expansion | Per-link desktop disclosures; mobile two-column sheet. |
| Optional utilities | cta, locale |
| Scroll | static, sticky |
| Constraints | Even split is preferred; broad image marks cap at 14rem. CTA never competes with the center. |
| Three typography profiles | luxury / fashion / geometric |
| Three art directions | publication / billboard / precision |

### NX03 · Dispatch

A publication masthead separates identity, edition context and a ruled destination register. Reading hierarchy takes precedence over header economy.

| Capability | Declared behavior |
|---|---|
| Scale | Standard · 5–8 destinations · parent + child hierarchy |
| Alignment | brand: left, center; primary: left, center; actions: right |
| Position / surface | flow / solid |
| Contrast / density | brand, light-on-dark, dark-on-light / comfortable, compact |
| Desktop | Large wordmark and colophon above a full-width section rail. |
| Mobile | Small masthead, two priority sections and a numbered editorial index sheet with expandable departments. |
| Expansion | Section disclosures and a numbered mobile index. |
| Optional utilities | cta, search, utility-links |
| Scroll | static, compact |
| Constraints | Flow only; compact state reduces brand scale but keeps every destination reachable. Avoid another full masthead immediately below. |
| Three typography profiles | editorial / brutalist / humanist |
| Three art directions | publication / billboard / precision |

### NX04 · Pocket Dock

A small signed launchpad holds only the current context and menu control; opening creates an adjacent destination fan with equal touch targets.

| Capability | Declared behavior |
|---|---|
| Scale | Small · 3–5 destinations · flat IA |
| Alignment | brand: left; primary: left; actions: right |
| Position / surface | floating, flow / solid |
| Contrast / density | brand, light-on-dark, dark-on-light / comfortable, compact |
| Desktop | Detached compact dock, deliberately withholding the full index until requested. |
| Mobile | Reachable compact launcher with an attached vertical sheet; no fixed bottom bar obstructing browser chrome. |
| Expansion | Nonmodal fan of individually numbered destinations. |
| Optional utilities | cta |
| Scroll | static, sticky |
| Constraints | No nesting. Floating only over a reserved safe zone; use flow for text-led Heroes. |
| Three typography profiles | geometric / playful / neo-grotesk |
| Three art directions | publication / billboard / precision |

### NX05 · Viewfinder

Identity and a framed menu trigger occupy opposite corners of a media-safe band. The revealed menu leaves a deliberate window onto the Hero.

| Capability | Declared behavior |
|---|---|
| Scale | Small · 3–5 destinations · flat IA |
| Alignment | brand: left; primary: right; actions: right |
| Position / surface | overlay, flow / scrim, solid |
| Contrast / density | light-on-dark / comfortable |
| Desktop | Corner wordmark, scene caption and discreet frame trigger; opaque panel occupies only the right half when opened. |
| Mobile | Full-height scene index with large destinations and a persistent close control. |
| Expansion | Cinematic side sheet; no navigation text directly on unclassified imagery. |
| Optional utilities | cta |
| Scroll | solidify, static |
| Constraints | Overlay requires reserved Hero headroom. Scrim is dark enough for white text over a white image. Flow uses a solid surface. |
| Three typography profiles | fashion / poster / luxury |
| Three art directions | runway / billboard / gallery |

### NX06 · Switchboard

A compact utility band carries task controls while a separate high-contrast destination band carries the site map. Identity belongs to the utility band.

| Capability | Declared behavior |
|---|---|
| Scale | Complex · 5–8 destinations · parent + child hierarchy |
| Alignment | brand: left; primary: left, center; actions: right |
| Position / surface | flow / solid |
| Contrast / density | brand, light-on-dark, dark-on-light / compact |
| Desktop | Utility/identity row above a dense, clearly named department row. |
| Mobile | Search remains a direct control; departments open as inline accordions with utility actions after them. |
| Expansion | Hierarchical destination disclosures with persistent utility access. |
| Optional utilities | cta, search, account, cart, locale |
| Scroll | static, sticky |
| Constraints | Maximum two levels; commerce/account/locale are labelled presentation previews. No account or basket state. |
| Three typography profiles | humanist / neo-grotesk / technical |
| Three art directions | publication / billboard / precision |

### NX07 · Atlas Hall

A directory gate opens a full-width hall of grouped destinations beside an authored orientation note. The taxonomy, not promotional cards, determines columns.

| Capability | Declared behavior |
|---|---|
| Scale | Complex · 5–8 destinations · parent + child hierarchy |
| Alignment | brand: left; primary: left; actions: right |
| Position / surface | flow / solid |
| Contrast / density | brand, light-on-dark, dark-on-light / comfortable, compact |
| Desktop | Brand, two priority routes and an explicit directory control; grouped mega panel reveals the full architecture. |
| Mobile | Single-column directory with independently expandable groups and visible parent destinations. |
| Expansion | Wide grouped mega disclosure; no hover-only access. |
| Optional utilities | cta, search, utility-links |
| Scroll | static, sticky |
| Constraints | 5–8 groups with at most 6 children each. Mega panel pushes content in flow; never covers Hero controls. |
| Three typography profiles | geometric / brutalist / technical |
| Three art directions | publication / billboard / precision |

### NX08 · Folio Takeover

A sparse colophon opens a full-screen typographic index. Oversized parent destinations and a quieter companion column create a deliberate reading sequence.

| Capability | Declared behavior |
|---|---|
| Scale | Standard · 5–8 destinations · parent + child hierarchy |
| Alignment | brand: left, right; primary: left; actions: right |
| Position / surface | flow / solid |
| Contrast / density | brand, light-on-dark, dark-on-light / comfortable |
| Desktop | Small signature and labelled Index control; open state dedicates the viewport to navigation. |
| Mobile | Editorial full-screen index, expandable child routes and a close control kept at the top of its scroll surface. |
| Expansion | Native modal dialog; parent/child hierarchy, inert background and focus restoration. |
| Optional utilities | cta, utility-links |
| Scroll | static |
| Constraints | No mega-menu density; eight parent destinations maximum. Longer indexes scroll inside the modal. |
| Three typography profiles | editorial / poster / humanist |
| Three art directions | publication / billboard / precision |

### NX09 · Margin Rail

A narrow vertical rail owns a separate page margin. A symbol leads a numbered vertical route register while the Hero occupies the remaining field.

| Capability | Declared behavior |
|---|---|
| Scale | Small · 3–5 destinations · flat IA |
| Alignment | brand: left; primary: left; actions: left |
| Position / surface | edge / solid |
| Contrast / density | brand, light-on-dark, dark-on-light / comfortable |
| Desktop | Left rail with symbol/wordmark, vertical index and bottom action; Hero gets an explicit reserved column. |
| Mobile | Rail becomes a top strip plus a labelled full-height side drawer; no sideways labels or hidden edge gestures. |
| Expansion | Modal side drawer on narrow artboards; desktop destinations remain visible. |
| Optional utilities | cta |
| Scroll | static, sticky |
| Constraints | Requires a composition wrapper reserving 13rem. Incompatible with full-bleed page chrome or independently sticky left rails. |
| Three typography profiles | geometric / brutalist / technical |
| Three art directions | publication / billboard / precision |

### NX10 · Threshold

The brand signs the entrance to the Hero; primary destinations form a broad threshold immediately after the opening scene. Navigation and image share a frame, not a component.

| Capability | Declared behavior |
|---|---|
| Scale | Small · 3–5 destinations · flat IA |
| Alignment | brand: left, center; primary: split; actions: right |
| Position / surface | flow / solid |
| Contrast / density | brand, light-on-dark, dark-on-light / comfortable |
| Desktop | Small opening signature and menu shortcut, then Hero, then a full-width numbered destination shelf. |
| Mobile | Top shortcut opens an inline index before the Hero; the post-Hero shelf becomes generous stacked destinations. |
| Expansion | Inline index keeps navigation available before the Hero has been traversed. |
| Optional utilities | cta |
| Scroll | static |
| Constraints | Flow-only wrapper; shelf belongs to navigation and follows any selected Hero. Do not repeat the Hero CTA in the shelf. |
| Three typography profiles | luxury / poster / humanist |
| Three art directions | publication / billboard / precision |

### NX11 · Channel Directory

A vertical department selector controls an adjacent detail directory. Parent overview links remain separate from buttons that select their children.

| Capability | Declared behavior |
|---|---|
| Scale | Complex · 5–8 destinations · parent + child hierarchy |
| Alignment | brand: left; primary: left; actions: right |
| Position / surface | flow / solid |
| Contrast / density | brand, light-on-dark, dark-on-light / comfortable, compact |
| Desktop | Compact signed header opens a two-pane capability browser with context for the selected department. |
| Mobile | Staged drilldown: choose a department, enter its destinations, return with an explicitly labelled Back button. |
| Expansion | Selected department and child directory; buttons use aria-pressed, not incomplete ARIA tabs. |
| Optional utilities | cta, search |
| Scroll | static, sticky |
| Constraints | One child level, 5–8 departments. Not appropriate for flat three-link sites. Staged mobile focus moves to the child heading and back to the chosen department. |
| Three typography profiles | humanist / neo-grotesk / technical |
| Three art directions | publication / billboard / precision |

### NX12 · Open Doors

Three to five large labelled doors each own a destination and an ordinal. A compact signature opens or folds the entire entry board, with no conventional link rail.

| Capability | Declared behavior |
|---|---|
| Scale | Small · 3–5 destinations · flat IA |
| Alignment | brand: left, center; primary: split; actions: right |
| Position / surface | flow / solid |
| Contrast / density | brand, light-on-dark, dark-on-light / comfortable |
| Desktop | Signature above an expandable horizontal board of oversized destinations; unequal door proportions express priority. |
| Mobile | Two-column board with the first destination spanning both columns, maintaining priority and generous touch areas. |
| Expansion | All destinations reveal in a graphic board rather than a list or megamenu. |
| Optional utilities | cta |
| Scroll | static |
| Constraints | Flat IA only. Long labels wrap inside doors. No mandatory imagery, ornamental arrows or hover-dependent navigation. |
| Three typography profiles | humanist / playful / brutalist |
| Three art directions | salon / billboard / precision |

### Shared alignment and composition contract

The contract declares supportedAlignments independently for brand, primary destinations and actions. Singleton arrays are structural invariants, hidden from the inspector. Shared pure controls and validation functions are ready for a future Composition inspector; unsupported values fail validation rather than being ignored. Leaving overlay deliberately selects solid/static; scrim requires light-on-dark. No global alignment knob can flatten all twelve designs into the same layout.

The workspace renders actual production Statement, Front Page, Open Circuit, Comparison and Vertical Record Heroes. All twelve studies were tested beside all five at desktop and mobile in flow or reserved-edge mode. Overlay/floating is separately tested with Comparison's declared navigation-safe opening. Other Heroes are hidden while overlay is selected. A strongly darkened band guarantees white navigation text contrast; no image-luminance guessing. No Hero implementation was changed. Margin reserves its own side column; Threshold puts its route shelf after the selected Hero. These wrapper needs remain explicit review constraints.

## 9. Interaction and motion

Implemented: native disclosures, visible parent-overview links, local destination previews, labelled menu states and relationships, Escape, nonmodal outside dismissal, native modal inertness with explicit Tab wrapping, close-button focus, focus restoration, modal scroll locking and staged-directory heading/Back focus. Primary controls are at least 44 CSS pixels tall. No critical interaction depends on hover.

Existing MotionPolicy governs short 180ms opacity/offset transitions. Reduced motion removes animations/transitions; hide/reveal stays visible and compact-on-scroll retains the full state. Scroll is local to the artboard. Static, sticky, compact, hide/reveal and scrim-to-solid exist only where declared.

- **NX01:** Short opacity reveal; hide/reveal returns immediately on keyboard focus or upward scroll.
- **NX02:** Sheet enters with a small vertical offset; reduced motion removes it.
- **NX03:** Brand scale compacts on scroll; no movement under reduced motion.
- **NX04:** Fan opens with existing restrained opacity/offset vocabulary; no radial flight.
- **NX05:** Transparent/scrim becomes solid after the opening; panel uses restrained fade, no image parallax.
- **NX06:** Immediate task access; only disclosure opacity animates.
- **NX07:** Short panel reveal; group hierarchy remains readable with motion disabled.
- **NX08:** Existing restrained opacity entry. Future stagger must never delay keyboard access.
- **NX09:** Drawer opacity/translation only; never horizontal scroll capture.
- **NX10:** No scroll choreography; threshold is visible content.
- **NX11:** Short pane crossfade; no carousel/swipe requirement.
- **NX12:** Restrained board reveal now; door hinges/3D folding are proposals only and require future motion review.

Future stagger, per-link choreography and 3D hinges remain proposals. No Motion Engine primitives were added.

## 10. Three-context adaptation results

| Context | Changed inputs | Authored Hero context |
|---|---|---|
| COMMON / GROUND · architecture | Stone/forest tokens, architectural wordmark, Practice/Places/Journal hierarchy, inquiry CTA, separate typography/art profiles per study. | Production Front Page and generated coastal photography; Comparison provides day/evening imagery. |
| OFF HOURS · streetwear | Acid/ink tokens, broad image logo, arrival/collection/campaign IA, drop CTA, fashion/poster/playful/brutalist voices. | Production Vertical Record and generated apparel photography; comparison labels View A / View B, not fabricated before/after results. |
| SECTOR ZERO · cybersecurity | Cool blue tokens, symbol + wordmark, eight-department platform taxonomy, walkthrough CTA, technical/geometric/humanist voices. | Production Open Circuit with labelled illustrative data; overlay proofs use illustrative topology diagrams, not certification or result claims. |

All 36 adaptations were exercised at 1440, 768, 390 and 320px, including every available open menu. All twelve passed long labels with a combined mark and missing image-logo → text fallback at 320px. Wordmark, symbol, combined, image and plain text are separately selectable. Broad image marks remain contained; symbol-only links have accessible full names.

Small studies use up to five priority destinations; standard/complex studies retain six architecture, seven streetwear and eight technical destinations where allowed. This is authored fixture selection, not a production truncation algorithm. Future implementations must not silently discard supplied navigation.

All routes lead to labelled local destination previews. Search/account/cart/locale/help report their presentation-only status. No external messages, transactions, authentication, route generation or commerce integration are implied.

## 11. Anti-convergence results

[The 66-pair dossier](ANTI_CONVERGENCE.md) compares brand ownership, IA, expansion, density, mobile and spatial hierarchy. Font, radius, alignment and opacity are excluded as differentiation evidence. Twelve mechanisms survive the local comparison, but similarity to existing systems lowers NX04 and NX08's priority. NX11 is a useful staged alternative to NX07's simultaneous taxonomy. NX10 needs composition-specific review of its after-Hero shelf. NX12 differs through a priority-weighted destination board, not typography.

## 12. Experimental shortlist

Seven recommendations prioritize collective breadth; they are not approvals:

- **NX01 · Datum:** An intentionally quiet, alignment-aware baseline for small sites.
- **NX02 · Meridian:** Centered-brand and luxury/retail coverage absent from production.
- **NX03 · Dispatch:** A true content/publication header, not an enlarged horizontal bar.
- **NX05 · Viewfinder:** Media-led sites gain a contrast-safe cinematic family.
- **NX06 · Switchboard:** Task-heavy and commerce headers need their own utility hierarchy.
- **NX07 · Atlas Hall:** Broad grouped IA fills the largest functional gap in the library.
- **NX09 · Margin Rail:** Adds a genuinely different spatial model without a bespoke Hero.

Hold for comparison: Pocket Dock (Island overlap), Folio Takeover (Contents overlap), Threshold (after-Hero placement tradeoff), Channel Directory (second complex-IA option), Open Doors (specialized flat campaign navigation).

## 13. Design Engine limitations

- Production navigation is flat and primarily text-brand based. Nested destinations, brand assets/fallbacks, active-route state, utilities and independent slot alignment need production contracts in a later approved pass.
- Placement compatibility is coarse in-flow/overlay with a Boolean safe zone. It cannot describe variable header height, exact safe regions, reserved edge columns or after-Hero ownership.
- Scroll policy has no production navigation contract. This proof listens to its artboard; productionization must bind the host scroll root and coordinate stacked sticky surfaces.
- Native dialogs enter the browser top layer. A narrow Lab artboard supplies menu width but the modal uses host-viewport height, making editor controls inert until closed. This is not a contained-device browser simulator.
- Depth is one child level. No automatic priority/overflow algorithm, breadcrumb generator, locale routing, search backend, account service or shopping bag exists here.
- Three-context verification covers authored data, not every future copy/font/logo combination. Automated accessibility audits supplement keyboard and visual checks; they are not cross-browser or screen-reader certification.

## 14. Verification and review gate

See [VERIFICATION.md](VERIFICATION.md) for commands and final results. Visual evidence: [desktop contact sheet](evidence/contact-desktop.jpg), [mobile contact sheet](evidence/contact-mobile.jpg), [expanded Lab](evidence/lab-review-ready.png), [mobile modal in Lab](evidence/lab-mobile-open.png).

Previous collections, registry lifecycle, production components, auth and database behavior remain intact. Collection 008, recipes, route generation, automatic composition and Motion Engine expansion were not started. **Stop here for human creative review.**
