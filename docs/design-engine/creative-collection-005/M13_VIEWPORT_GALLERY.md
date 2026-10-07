# M13 — Viewport gallery

Current status: **Approved**, following the user's explicit instruction to add it. The reusable `work.viewport-gallery` implementation is now separate from this preserved original study. See [production contract and QA](../productionization-004-005/M13_PRODUCTION.md). The creative validation below records the original study milestone.

A Lab-only thirteenth concept, selected by default. Navbar followed immediately by a gapless two-column gallery; no hero, introductory copy or footer consumes the opening viewport. Four original client adaptations supported. The current urban adaptation pairs the two faceless solid-background studio images first, then the street / gym location photographs.

Desktop: navbar 72px + first image row 828px in the 900px-tall artboard. Tablet: navbar 72px + row 952px in the 1024px artboard. Phone: navbar 112px + two 366px rows in the 844px artboard. The two-column rule remains at all three widths. Outside Lab the height defaults to 100svh. Further images create ordinary document rows; odd counts leave the last second column empty, without invented/repeated images.

Hover or keyboard focus reveals the opaque floating detail card above the lower part of each image. The card stays open while hovered. Clicking / tapping the image or visible plus/minus pins / closes it. Escape dismisses; keyboard focus has a visible outline. Panels have expanded/control relationships, hidden states, titles and readable details. No motion is required. Navbar category buttons actually filter the images and update the count.

The studio apparel images use contain to keep full silhouettes. Other campaign imagery uses the authored focal point and cover for an edge-to-edge crop.

## Validation

- Browser layout matrix: four clients × desktop/tablet/mobile = 12 cases. Exactly two columns, no section overflow, 4/5/6-image counts produce 2/3/3 rows. Architecture demonstrates the odd final row.
- Urban first-viewport geometry: 72 + 828 = 900 desktop; 112 + 366 + 366 = 844 phone.
- Actual pointer hover revealed the title/details. Keyboard focus and Enter revealed the panel; Escape closed it. Repeated activation toggled correctly. Native clicks on the visible plus/minus target also closed and reopened it.
- Training filter reduced four pieces to two. All pieces restores the full grid.
- A focus stacking defect discovered during verification was corrected by placing the floating card above the focused image.
- Typecheck, scoped ESLint and all four media contract tests pass. Contract rendering now covers 52 client/concept combinations.
- This checks responsive Lab artboards, not physical mobile hardware. No production promotion or commerce behavior added.

[Desktop detail state](m13-review/M13-desktop-details.jpg) · [Phone detail state](m13-review/M13-mobile-details.jpg) · [Layout measurements](m13-review/layout-checks.json) · [Human review](HUMAN_REVIEW.md)
