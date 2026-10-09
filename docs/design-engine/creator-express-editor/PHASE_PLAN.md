# Creator Express editor and component plan

Date: October 9, 2026

Status: Approved and implemented. Final verification and production release are tracked in IMPLEMENTATION.md.

## Execution and review order

Implement **Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5**. The user approved the plan and subsequently authorized all phases without review pauses, including browser checks and pushing tested, committed work live.

This order stabilizes editing before adding controls, establishes reusable styling before polishing the draft, and then adds motion and realistic viewport inspection to the finished composition. Phase 2 has internal work steps because of its size; those steps remain one phase unless the user changes the review boundaries.

The previous creator component/media release is separate from this work. The current authorization explicitly includes deploying these phases after testing.

## Current draft and evidence

The current browser draft is **Muse Bennett**, Home, in the Composition workspace at the production Lab. Its palette is Neutral Light, with luxury typography and publication art direction. The current component sequence is:

| Position | Component | Section ID |
| --- | --- | --- |
| 1 | Navigation — `navigation.meridian` | `navigation` |
| 2 | Hero — `hero.scene-poster` | `opening` |
| 3 | About Me — `about.creator-profile` | `approach-3` |
| 4 | Featured carousel — `work.apple-cards` | `approach-2` |
| 5 | Socials — `proof.social-reach` | `approach-4` |
| 6 | Brand Work image rail — `work.expand-rail` | `approach-1` |
| 7 | Services — `services.service-field-atlas` | `approach` |
| 8 | Testimonials — `proof.moving-chorus` | `approach-5` |
| 9 | Contact — `contact.inquiry` | `approach-6` |
| 10 | Footer — `footer.sitemap` | `approach-7` |

Observed in the browser: About Me and social content panels remain duplicated while Navigation is selected. In the source, the creator and ending editors use identical sibling keys, friendly creator inputs commit on blur, and the JSON text is initialized independently of subsequent friendly-field changes. These are investigation starting points; reproductions and regression checks will establish the complete fix.

The draft also includes architecture/service demo copy, example social/contact destinations, demo testimonials, and an inconsistent footer identity. Several navigation destinations currently target the same opening section. Those belong to the content pass, not an editor reset.

Before Phase 1 changes, capture an export of the current authored draft for recovery and comparison. Preserve its section IDs, order, page identity, selected media, and authored content. Do not replace it with a starter fixture. The current browser tab has been inspected without changing its data.

## Phase 1 — Editor correctness and layout

### Work

1. Reproduce leaking/duplicated panels when selecting different components, changing pages, and returning between tabs. Correct editor identity, mounting, and selection handling so each panel belongs to exactly one selected section.
2. Establish one validated section model for friendly fields, Client Data JSON, preview, and persistence. Route both editing surfaces through the same update path.
   - Friendly field changes automatically refresh JSON and preview.
   - Valid JSON changes automatically refresh friendly fields and preview as soon as the document is valid; no separate Apply/Read-current routine is needed for synchronization.
   - Incomplete or invalid JSON remains editable, with a clear error, while the last valid section stays in the preview. Preserve unfinished edits per section during navigation rather than silently discarding them.
   - Preserve focus/cursor position while typing. Do not remount a text field on every value change or overwrite an unfinished JSON draft with unrelated UI updates.
3. Reorganize existing content controls into readable, component-specific groups: heading/copy, media, actions, and repeatable records as applicable. Use summaries for collapsed records, clear add/remove controls, sensible field widths, and a separate advanced JSON disclosure. Remove duplicate representations and irrelevant panels.
4. Rebuild the Composition editor shell:
   - **Left:** Site, Pages, and Sections controls, including section order and page structure.
   - **Center:** Site preview, with sizing accounting for both panels.
   - **Right:** Selected section inspector with **Design** and **Content** tabs.
   - Site/page settings stay with their respective left-side scope. Section styling goes in Design; client text, media choices, and destinations go in Content. Advanced diagnostics stay out of the ordinary content flow.
5. Preserve save/export/import behavior and the existing device previews through the shell change. Prepare the right-side tab structure for Motion in Phase 4.

### Review result and acceptance

- Selecting Navigation, About, Socials, Contact, and other component types shows only applicable fields, with no duplicated panels.
- A friendly-field edit appears in JSON automatically; a valid JSON edit appears in the fields automatically. Invalid JSON cannot corrupt or erase the section.
- Section/page/tab switching and reload preserve committed edits; unfinished input has explicit, predictable handling.
- Left/right panels work at supported desktop widths without obscuring the preview or losing keyboard access.
- Deliver a local editor preview, focused regression results, and screenshots of the revised layout.

## Phase 2 — Shared styling and reusable component updates

### 2A. Shared typography and heading spacing

- Add page-level controls for title, eyebrow, description, and body sizes, with corresponding line height, text measure, and heading-group spacing. Site defaults may supply the baseline; page choices override it.
- Give every applicable section an explicit **Inherit** / **Override** choice. Inheritance must affect the rendered component rather than being defeated by hardcoded component CSS. An intentionally larger hero title can use an explicit override.
- Standardize eyebrow-to-title and title-to-description spacing while retaining chosen section alignment. Let long descriptions/titles use an appropriate configurable width.
- Use responsive sizing so the same settings remain usable on tablet/mobile. Keep older saved compositions readable through backward-compatible defaults and schema handling.

### 2B. Shared CTA, icon, and control styling

- Audit every registered component that renders a CTA or interactive button, including native media actions and carousel navigation that bypass the shared action renderer.
- Provide coherent button choices: filled, outline, text, and icon-only where appropriate; square/soft/rounded/pill geometry; size; icon selection, placement, and visibility; and hover presentation.
- Provide hover choices such as none, color change, lift, icon movement, and underline where appropriate. Underlining must be selected rather than forced on the hero CTA.
- Keep links, destinations, keyboard focus, and touch behavior correct. Phase 4 expands the animation catalog using this same shared presentation model.

### 2C. Component improvements

| Component | Reusable changes and draft direction |
| --- | --- |
| About Me | Configurable interest-tag geometry and spacing; apply square tags to the Muse draft. |
| Featured carousel / Brand Work galleries | Choose media action icons and icon-only/container presentation; configurable carousel/slider navigation shape, size, and visual treatment. Use bare icons and square navigation where they fit this draft. Cover both gallery components present in the page. |
| Social Reach | Correct centered eyebrow, description, title width, and complete heading alignment. Add stat layouts such as columns, a grid, inline groups, and cards; independent typography, gaps, separators/backgrounds, and alignment. Add social link display as icon-only, icon plus label, handle, or fuller link treatment. Extend the existing SVG icon system with a broad platform set including Instagram, TikTok, YouTube, Twitch, X, Threads, Facebook, LinkedIn, Pinterest, Snapchat, and Bluesky. Icon-only links retain accessible names. |
| Moving Chorus testimonials | Remove the visible Pause animation button, Read all voices disclosure, and forced demo eyebrow. Make any retained eyebrow ordinary editable/optional content. Expand description width. Add card width/height, gap, padding, scroll speed/direction, and optional hover enlargement. Make quote, portrait, name, role, and company display/order customizable. Add card treatments including transparent backgrounds; portrait size, frame, position, and alignment; and horizontal/vertical content alignment. Keep the canonical testimonials readable and accessible without requiring the removed disclosure or exposing duplicated loop copies. |
| Contact | Restyle the section for the draft's cream/square creator aesthetic. Expose heading, spacing, layout, surface, and action styling. Support no image, a side image, or background imagery with configurable crop, placement, and overlay/readability controls. Preserve existing contact/form functionality rather than implying an unconnected form submits successfully. |
| Other headings and buttons | Apply the shared typography, spacing, inheritance, and action controls across all eligible registered components, including Services, navigation, and footer controls. |

### Review result and acceptance

- Page-level role sizes/spacing visibly agree across sections; disabling inheritance on one section changes only that section.
- Every component with a button has appropriate presentation controls, with an explicit coverage audit.
- Socials work with left/center/right alignment, different stat counts, and icon-only links.
- Testimonials work with missing portraits/companies, long quotes, transparent cards, reordered content, and small screens; removed controls and forced copy are absent from the component.
- Contact works with each media mode and remains editable.
- Validate affected schemas, persistence, shared renderers, and portable/exported output. Review desktop/tablet/mobile examples and the Muse draft.

## Phase 3 — Creator Express content pass

### Work

1. Work from the user's latest saved Muse draft, including any changes made during the preceding reviews. Retain the authored Hero/About content and media and the existing section sequence. Preserve already-authored brand labels such as Essence x Moo, Fit Culture, and Bordeaux.
2. Continue the substantive content pass from **Brand Work through Footer**: project descriptions/captions, creator-appropriate services, testimonials presentation/content, contact copy, and footer identity/links. Check the preceding Featured/Socials sections for residual example data and broken destinations without replacing authored media or expanding the rewrite without approval.
3. Use section-specific media overrides where they improve the story; they may override Creator Neutral Light. Retain the earlier requirement that creator imagery includes the relevant Black creators/male creator and does not expose full faces. Prefer the already-approved images where suitable.
4. Unify the page voice around Muse Bennett, lifestyle/wellness/food/product content, and collaboration. Replace the architecture and Field Practice/Daily Frame demo identities.
5. Correct navigation/CTA/social/footer destinations to their intended sections or supplied profiles. Keep real metrics, endorsements, partner claims, contact details, and profile URLs grounded in information supplied by the user; clearly retain an editable placeholder where that information is missing.
6. Supply the updated draft/export and a short list of any factual details still needed from the user. A local draft/content edit must survive refresh and import/export without changing the underlying component defaults for other clients.

### Review result and acceptance

- Hero/About and authored media remain intact; approved component refinements from Phase 2 remain applied.
- Brand Work through Footer reads as one creator portfolio and no longer carries unrelated example identities or services.
- Footer branding, links, copyright, and contact direction fit the page. Navigation no longer routes every item to the opening section.
- Confirm the actual draft render, link behavior, responsive copy flow, and export round trip. Stop for content approval.

## Phase 4 — Motion system and Motion tab

### Work

1. Add a dedicated **Motion** tab to the right section inspector. Establish site defaults, optional page overrides, and section inheritance/explicit overrides. Separate entrance/exit effects, media hover, CTA motion, and a component's intrinsic behavior such as a testimonial loop.
2. Build a compatible motion catalog:
   - Entrance/exit: none, fade, directional reveal, blur reveal, scale/zoom reveal, clip/mask reveal, and combinations appropriate to a component.
   - Sequential heading/media/card reveals with configurable order and stagger.
   - Media hover: subtle zoom, crop/pan, lift, tilt, and tone/overlay transitions where supported.
   - CTA hover: icon slide, lift, fill/sweep, underline reveal, and other suitable modern treatments using the shared button system.
3. Expose relevant duration, delay, easing, distance/scale, blur amount, stagger, trigger threshold, and play-once/replay choices. Provide useful presets and bounded controls rather than requiring animation code.
4. Make compatibility explicit for every current component. Animate suitable internal pieces without breaking sticky navigation, gallery controls, media playback, links, card loops, or layout. Unsupported combinations should explain their limitation rather than silently doing nothing.
5. Show effective motion in the ordinary editor preview and provide a replay control. Ensure preview auditions, hidden workspaces, and data edits do not trigger competing animations or reset content unexpectedly.
6. Respect reduced-motion preferences; retain readable, keyboard-accessible content and predictable touch behavior. Coordinate testimonial hover/focus behavior and movement with the new motion settings without restoring the removed Pause button.

### Review result and acceptance

- Site defaults and section overrides both work, including explicit None and return-to-Inherit.
- Preview behavior matches the shared/portable site renderer.
- Demonstrate representative entrance, exit, blur, stagger, media-hover, and CTA effects across the current page; complete compatibility checks for all registered components.
- Check reduced motion, focus/touch, editing without jumps, and smooth scrolling/performance.

## Phase 5 — Visitor viewport spacing and full-browser preview

### Work

1. Add section height/spacing options: natural content height, at least one visitor viewport, and configurable viewport proportions/minimums with responsive padding and vertical alignment. Use minimum height rather than clipping content to a fixed viewport height; content can grow on short screens or when copy is long.
2. Measure the visitor viewport independently of the scaled Lab artboard. A section's viewport setting must mean the same thing in normal preview, full-browser preview, and the exported/live site.
3. Add a top-of-Lab **Full preview** action. Render the entire current site using the actual browser area, hide editor panels/admin chrome, and remove the scaled-artboard constraint. Include the same draft, typography, media, navigation, and motion.
4. Provide a draggable exit control that stays within the visible viewport, with keyboard-accessible exit and Escape support. Return to the previous section, editor tabs, draft, and useful scroll position without reload or data loss.
5. Retain existing device preview options and test long-content overflow, navigation placement, different viewport heights, and mobile browser viewport changes.

### Review result and acceptance

- Viewport-sized sections fill the expected screen space and remain readable when content exceeds it.
- Full preview shows realistic browser margins and heights, with working navigation, links, galleries, and motion.
- Dragging/repositioning the exit control and leaving preview preserve editing state.
- Compare normal, full-browser, and portable output at desktop/tablet/mobile widths and short/tall viewport heights.

## Verification and completion boundaries

Each phase includes appropriate type/lint checks, meaningful regression tests for changed behavior, and browser review of the affected flows. Schema changes must preserve old draft loading and save/export/import compatibility. Verify reusable behavior against more than the Muse page where applicable; keep unrelated work in the repository outside these changes.

Report the combined result, verification, live release and remaining content placeholders at completion. The user explicitly authorized all phases and publication without intermediate approvals.
