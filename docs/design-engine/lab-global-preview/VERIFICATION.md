# Site and Page hover previews — 1 October 2026

Composition's Page tab now precedes Site: **Section · Layout · Page · Site · QA**. Panel descriptions explain that Site supplies shared defaults, Page overrides those defaults for this page, and Section overrides take precedence over both. This preserves the existing site → page → section architecture.

All Site and Page visual editing choices now audition on the actual canvas before application:

- Site typography, art direction, motion intensity, brand theme and icon stroke.
- Page typography, art direction and motion, including Inherit.
- Semantic color palettes and custom color drafts, plus clearing color overrides.
- Drafted section content/media via hovering or focusing Apply client data.

Open a control, then hover or keyboard-focus a choice to preview it. Explicit activation applies it. Leaving, Escape, outside dismissal, tab/section changes and reset discard uncommitted previews. Saved composition JSON remains authoritative throughout. Each candidate passes the existing schemas and compatibility checks; unsupported global choices retain their reasons and cannot preview/apply. Site previews preserve Page and Section precedence rather than overwriting overrides just to force a visible difference.

Colors have theme-derived palette swatches and a draft color/hex input. Swatches preview on hover/focus and apply on activation. Editing the custom input shows a temporary candidate; Apply commits it. Incomplete hex values restore the saved canvas and disable application. Cancel/Escape restore the authored color. The editor uses explicit text color for readable hex input contrast. Free-form client colors still need final contrast review in their actual content context, as before.

## Verification

- **531 tests / 60 files**, typecheck, lint and production build pass; logs in `evidence/`.
- **43 Site/Page browser checks pass**, including all typography choices, global/page/section precedence, Inherit removal, art/motion previews, keyboard application, brand themes, icon stroke, palette and custom color drafts, invalid hex, reset/content audition cancellation, strict invalid data, unsupported art choices, tab order and stale-preview cancellation.
- Full editor/canvas WCAG A/AA audits pass with zero violations for the Page picker and color editor under the authored theme. No unexpected console/page errors. An intermediate audit caught the new hex input inheriting black text on the dark editor surface; the explicit editor text color fixes it.
- The **25 section edit** and **28 existing Lab workflow** checks pass with the extended controls, preserving earlier section previews, blank defaults, direct insertion, Object Study, zoom, demos and confirmed reset.
- Page/color screenshots were visually inspected.

Reproduce with `scripts/design-engine-qa.mjs`, axe supplied via `DESIGN_ENGINE_AXE`, the loopback server at port 4187, and `scripts/design-engine-lab-global-preview.mjs` using the installed Playwright module. Checks use actual Lab components in local Chrome without adding app routes or bypassing staff authentication. Physical device/browser certification and signed-in staff-route testing are not claimed.
