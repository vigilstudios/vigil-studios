# Section edit previews — 1 October 2026

Composition's Section editor now uses the same audition/apply behavior as Layout's section additions. Open a choice control and hover or keyboard-focus its options to see them on the actual canvas. Click, Enter/Space or touch activation applies the chosen value. Leaving the options, closing the control, clicking outside, pressing Escape, changing selected section or switching editor tabs discards an uncommitted preview.

This covers registered section replacement, structural variant, section typography, section art direction, media geometry/tone, navigation placement and supported motion behavior/intensity. Fixed properties remain fixed; unsupported choices retain their explanations and cannot preview/apply. Native selectors remain for choosing the selected section. The subsequent [Site/Page extension](../lab-global-preview/VERIFICATION.md) applies this behavior to global layers and colors as well.

Authored composition data remains unchanged during a preview. The controls continue to represent the saved section, so hovering successive choices always starts from the same saved baseline. Only the canvas receives the candidate section. Changes preserve sibling sections and global layers, and replacements use the same supported-local-layer adaptation as a committed replacement. Preview and commit use existing strict schemas, transition rules and composition compatibility checks. Existing reduced-motion policies still govern rendered motion.

The shared `PreviewChoiceControl` provides named triggers, selected-state buttons, keyboard Arrow Up/Down/Home/End browsing, Escape/focus return and outside dismissal. Preview cancellation is associated with the originating control, so cleanup from another control cannot cancel a newer audition. No client-site component API or production registry disposition changed.

## Verification

- **531 tests / 60 files passed**, typecheck, lint and production build passed; logs in `evidence/`.
- **25 section edit browser checks passed**: all typography choices, saved-data immutability, sibling/global independence, pointer leaving, arrow-key preview, Escape/focus return, committed typography, art direction, media tone, whole replacement cancellation/commit, structural preview and Space commit, fixed incompatible placement, tab/section switching, outside dismissal and reduced-motion compatibility.
- Open-picker WCAG A/AA audit: zero violations. No unexpected browser console/page errors.
- All **28 existing Lab workflow browser checks** passed again with the new replacement picker, retaining blank defaults, direct addition, Object Study, gesture zoom, demo loading and confirmed reset.
- Typography preview screenshot was visually inspected.

Reproduce with the loopback bundle from `scripts/design-engine-qa.mjs`, optional axe script supplied via `DESIGN_ENGINE_AXE`, server at port 4187, and `scripts/design-engine-lab-edit-preview.mjs` / `scripts/design-engine-lab-workflow.mjs` using the installed Playwright module. Browser checks use the actual Lab components in local Chrome, without exercising protected staff sign-in or adding authentication bypasses.
