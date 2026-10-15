# Express catalogue device previews

The phone preview now keeps a 390 × 844 content viewport instead of shortening to a square on smaller screens. Desktop preview is also selectable on phones and keeps a 1200 × 700 content viewport. A ResizeObserver measures the visible content box and scales the complete iframe uniformly, so typography, imagery, fixed navigation and viewport units retain their actual device proportions at every host width. The preview wrapper still clips without becoming a scroll container.

One sticky 48px row immediately beneath the industry rail contains a left aligned device toggle, centered native variant dropdown and right aligned Motion button. All three controls are 32px high. The selected variant retains its name and accent color; a chevron appears when more choices exist. Device labels become icons on phones. Explicit device selection persists through host resizing, variant and industry changes; mobile defaults to phone preview.

Changes are isolated from the older dirty checkout and based on production main 25310e6. No templates, pricing, checkout, publication data or database schema changes.

Validation: typecheck and full lint passed. The existing suite passed 2,314 of 2,315 tests on the first run; the broad design-theme rendering test exceeded its 5-second timeout under concurrent load. Its entire 13-test file passed immediately in isolation (rendering test completed inside 1.95 seconds total test time). Responsive browser and release verification are recorded below when complete.

The optional browser check is `scripts/verify-express-catalogue.mjs`. Run with Playwright installed (or PLAYWRIGHT_MODULE pointing to its module), BASE_URL set to the target origin and optionally QA_OUT for receipts. QA_ROUTE permits an isolated fixture route; the default tests the published /express catalogue. It checks natural iframe viewport dimensions, rendered bounds, control alignment, both device modes, navigation/inner scrolling, Motion reset and each variant.
