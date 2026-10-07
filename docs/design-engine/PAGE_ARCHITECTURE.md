# Page & Site Architecture Foundation

> **Contextual Action integration, 5 October 2026:** optional `contextualActions` now carries primary/secondary slots and stable item identities alongside the compatible legacy `actions` path bindings described below. Presentation is separate from the existing typed destination union. The same central resolver, persistence, duplication, deletion-impact and broken-target diagnostics cover both. Composition offers real nested Page + Section pickers and capability-aware CTA editing. Read [Action architecture](ACTIONS.md), [audit](action-integration/AUDIT.md) and [verification](action-integration/VERIFICATION.md).

## Audit and decisions (5 October 2026, before implementation)

The engine is in `vigil-studios`. Existing `composition/schemas.ts` supplies strict site creative settings, `PageComposition` and discriminated section instances; `validation.ts` owns capability checks and `render.tsx` owns production dispatch. Composition Lab holds one transient composition and optional QA demos. Design Lab is a separate workspace. There is no canonical page tree, saved site, slug utility or engine route model. Dashboard/customer routes and Express are unrelated and will not be changed.

Extend these contracts in place. `SiteDefinition` wraps the existing site settings and page-owned sections. The existing `PageComposition` stays the renderer/legacy QA projection, not a second canonical page model. A versioned JSON document is the portable source of truth. The Lab edits that document, persists a local draft, and imports/exports it for customer repositories; no database schema or deployment changes.

Page IDs are opaque stable identities, independent of labels and routes. Parent IDs form an acyclic tree with arbitrary depth; sibling order is explicit. Slugs are normalized relative segments (root `/` is unique and top-level); optional absolute route overrides are explicit. Duplicate effective routes are rejected, including descendants affected by moves. Previous routes are recorded as redirect candidates, without implementing redirects.

Global Navigation and Footer are stored once. Each page explicitly inherits, omits or replaces each slot; no footer design is generated. The renderer projects effective slots around that page's own sections. Global creative settings retain existing site → page → declared section precedence; brand/icons remain site-owned.

Actions are a discriminated union (page, section, external, email, phone, download). Section envelope bindings attach actions to existing href fields by a validated content path. A central adapter resolves these to existing production props at render time, preserving narrow component schemas and all Collections 003–008 implementations. Unbound legacy hrefs remain supported. Broken bindings are editor diagnostics and block the affected page preview, never silently use stale href fallbacks. Future behavior types require a new union member/resolver, without speculative modal/commerce behavior.

Navigation derives stable destinations from visible site pages in sibling order. Hidden ancestors hide their branch; draft pages may be included explicitly for editing. Navigation slots opt into site derivation; legacy Design Lab fixtures retain authored menus. Full tree versus top-level projection and optional explicit page selection are intentional controls. Existing destination-count and hierarchy capabilities are checked before rendering: unsupported depth/count is explained, never silently truncated. Atlas Hall and Channel Directory support recursive disclosure below their distinct index/department panels; other existing nested systems retain two levels and flat systems one.

Deletion requires an explicit subtree or reparent-children strategy and reports incoming actions. Page duplication creates new IDs for the page and sections, clones mutable data, retargets self-links/section-links and generates a unique sibling slug; descendants remain with the original page. Editor selection/auditions stay transient.

Recipes, dynamic content, AI composition, Collection 009, new Footer designs, Motion Engine, automation, Express and Scar are outside this milestone.

## Canonical contracts and renderer projection

`design-engine/site/index.ts` is the portable API. The canonical definition is runtime-validated JSON:

```ts
SiteDefinition = {
  version: 1,
  id: string,
  title: string,
  settings: SiteConfiguration, // existing brand/type/art/motion/icons
  navigation: { homePageId, includeDrafts, action? },
  globals: { navigation?: SectionInstance, footer?: SectionInstance },
  pages: SitePage[]
}
SitePage = {
  id, title, navLabel?, slug, routeOverride?, pageType,
  parentId: string | null, order, showInNavigation,
  status: "draft" | "published",
  sections: SectionInstance[], overrides?: CreativeOverrides,
  seo: { title?, description?, noIndex? },
  slots: { navigation, footer },
  previousRoutes: string[]
}
```

Each slot is `{ mode: "inherit" }`, `{ mode: "omit" }` or `{ mode: "replace", section }`. Navigation/Footer cannot also appear in `page.sections`. `effectiveSections` and `pageComposition` project the slots around the body into the established renderer. `siteFromComposition` migrates every legacy QA composition without changing its component payloads. There are still 127 existing QA compositions and no new component registrations.

Page types are semantic, never templates: `home`, `standard`, `about`, `services-index`, `service-detail`, `portfolio-index`, `project-detail`, `shop`, `collection`, `product-detail`, `testimonials`, `contact`, `blog-index`, `article`, `landing`, `custom`. Existing registry vocabulary remains valid: `services`, `portfolio`, `pricing`, `category`, `product`, `lookbook`, `campaign`, `search`, `results`, `customer-stories`, `case-studies`, `recognition`. Registry validation consumes the same exported vocabulary.

## Routes and mutations

`resolveRoutes` is the single deterministic route resolver. The only root slug is `/`; it cannot have a parent and its effective route cannot collide with another page. Other slugs are relative segments, optionally containing explicit segment separators. Normalize trims, lowercases, removes combining accents, replaces unsafe character runs with `-`, collapses repeated hyphens/slashes and rejects empty segments. An explicitly authored absolute route uses `routeOverride`; children inherit that effective parent route. Route overrides can be cleared. Route length is bounded to 2000 characters, without an arbitrary depth limit.

Changes are immutable and validated before commitment. IDs are never rewritten by rename/slug/move. Sibling order uses `order`, then stable ID as a deterministic tie breaker. New siblings append after the maximum existing order, including sparse imported orders. Reorder controls normalize the affected sibling group's order. Reparenting validates the entire descendant route map, preventing a collision introduced several levels below the moved page. A moved subtree stays intact; removing a parent promotes the page to top level.

`updatePage` records old effective routes for every affected page/descendant in `previousRoutes`. These are historical candidates only; a host must check reuse and policy before generating future redirects. No redirect-management system is implemented.

`duplicatePage` duplicates one page, not its subtree. It clones sections and explicit slot replacements, creates new page/section identities, picks a unique sibling route, adjusts any custom Navigation label, starts as draft and clears route history. Self page/section actions retarget the duplicate; references to other pages remain unchanged. Descendants remain under the original. Inherited globals remain inherited.

Deletion presents Cancel/Escape and two explicit strategies: remove the subtree or promote immediate children to the deleted page's parent (keeping their subtrees). The editor reports affected pages and incoming typed actions. Home deletion is blocked until another `homePageId` is selected. Reparent collisions abort deletion. Explicit navigation selections drop removed IDs; incoming actions remain broken diagnostics so authors can repair them deliberately.

## Typed actions and component compatibility

```ts
Action =
  | { type: "page", pageId: string }
  | { type: "section", pageId: string, sectionId: string }
  | { type: "external", url: string }
  | { type: "email", email: string }
  | { type: "phone", phone: string }
  | { type: "download", url: string, filename?: string }
```

The section envelope has optional `actions: { path: (string | number)[], action: Action }[]`. Example:

```json
{
  "path": ["content", "action", "href"],
  "action": { "type": "page", "pageId": "page-contact" }
}
```

This binding takes precedence over the legacy href only during materialization. IDs, action bindings and original typed client payloads remain in the serialized document; resolved hrefs are disposable renderer props. Bindings reach nested Services/Commerce destinations through array indices as well as Hero CTAs. Paths must point inside content to an existing href field, with an explicit Navigation-only exception for `content.home` (the logo destination); duplicate paths and prototype keys are rejected. Changed/missing array fields become diagnostics; authors must review bindings after restructuring content arrays. Existing host-resolved keys are retained, without adding a dynamic content family.

`resolveAction` centralizes validation and routes. `materializeActions` and `materializeComposition` clone before resolving, then the established section/composition schema validates the resulting props. Missing page/section/field targets never use the old href as a silent fallback. External actions require HTTP(S); email/phone/download are explicit types. The existing component's destination protocol/length limits continue to apply. `ActionBoundary` supplies native download attributes for bound destinations; browser cross-origin download rules still apply. Production application hosts can also use `resolveAction` directly for href/download attributes.

Other sections retain typed action type/page/section controls, validated destinations, stale-binding removal and return to an authored href. Navigation instead has direct item controls described below. Site retains the shared Navigation CTA, which is also editable alongside the navbar. Modal, booking and product/cart behaviors require future union members/resolvers; none are speculatively implemented.

## Site-derived Navigation

A Navigation section opts in with:

```json
{ "navigationSource": { "mode": "site", "depth": "all" } }
```

Optional `pageIds` provides an ordered, explicit entry selection; `depth: "top-level"` intentionally renders that selection flat. This supports curated compact Navigation without silently dropping deeper pages from the site. The normalized model retains `pageId`, typed action, label, resolved href and recursive children. Materialization strips only model-only fields before supplying existing component props. Home uses `navigation.homePageId`; custom Navigation labels take priority over titles. Hidden pages exclude their branch; published-only mode excludes draft ancestors and their branches. Draft inclusion is explicitly enabled in the internal QA fixture.

`navigationHierarchyDepth` extends the established production capability metadata while preserving approved creative-study definitions. Flat systems support one level; Datum/Meridian/Dispatch/Switchboard/Folio Takeover support two. Atlas Hall and Channel Directory support recursive deeper groups, preserving their existing directory versus staged department panels. Legacy Primary/Island/Contents remain flat. Existing top-level destination ranges and six-child-per-group bounds still apply. Invalid count, depth, duplicate labels, overly long labels or missing explicit page references are useful diagnostics. No implicit truncation or forced universal menu.

Recursive disclosures use native details/summary with links to both the parent and descendants, keyboard activation, nested Escape collapse and touch-sized targets. Nested lists stay in document flow within the panel. Channel Directory retains department selection, heading focus and Back focus restoration. Modal/nonmodal behavior, mobile arrangement and each approved system's visual/scroll identity remain distinct.

### Direct navbar editing

Select the Navigation in Composition → Section. **Navbar links** shows each real menu item with **Menu label**, a **Destination** picker containing readable page names/routes, and **Opens /resolved-route**. Nested items use the same controls. **Apply navbar links** commits the menu; Add/Remove/sibling moves rebuild all typed bindings so array changes keep the correct page targets. **Manage pages** opens Pages directly. Technical action paths and comma-separated IDs are not required by this UI.

An automatically derived menu starts with the actual Site Tree destinations, rather than the component's stored demo content. Applying individual edits intentionally switches that section to a custom menu without changing the page hierarchy. Default page labels are used when choosing a destination; deliberately authored menu labels remain editable. **Use pages from the Site Tree** restores automatic labels/order and lets the author explicitly include nested pages or top-level pages only. Existing count/depth limits remain enforced with readable errors.

The navbar button, logo/home link and utility links each have their own direct Destination picker and Apply control. A shared CTA in an automatic menu updates the existing site Navigation action; converting that menu to custom preserves the currently visible CTA as a stable section binding. An explicit logo/home action overrides the default `homePageId` route for that Navigation and survives target slug changes. Legacy URLs remain inspectable until a page or another typed destination is chosen. External, section, email, phone and download choices remain available in the same picker.

## Editor, inheritance and persistence

Pages replaces the former Page tab between Layout and Site, combining the ordered Site Tree, current-page indication, nesting, labels/types/visibility, Add/Duplicate/Delete, sibling moves, draft-and-Apply page metadata and creative overrides. Parent options exclude self/descendants; validation also rejects invalid imported cycles. Page owns controlled typography/art/motion overrides, SEO, slots and composition. Section controls continue to use declared capabilities, audition and explicit commitment. Site owns brand, icons and shared defaults; proposed global creative choices are checked against all pages. Demos seed only the selected page with supported local layers and never replace the complete site. Clear canvas confirms removal of only the current page's sections/overrides/slots; site settings and other pages survive.

Global Navigation edits from an inheriting page intentionally affect the shared instance. Site explains this and offers creation of a deliberate page replacement, or adoption of a page replacement as the global section. New pages inherit globals. Footer has the same validated ownership model but no contributed production implementation exists; the engine does not substitute a different section category as a Footer.

Interact with preview follows internal routes by selecting the matching site page and, for section actions, scrolling to its section without leaving the Lab. Design remains an independent inspection workspace and retains its component/study inventory.

`parseSiteDefinition` validates version, strict settings/page/section shapes, parent graph/routes, global/replacement categories and effective section identities/count. Structurally valid drafts can retain broken action or capability diagnostics so authors can repair them in the editor. `serializeSite` / `deserializeSite` form the import/export boundary. JSON import is draft-and-confirm and atomic on failure; export downloads the complete document. No React nodes, runtime fonts, transient selection, audition or viewport state enter that document.

Lab autosaves version-1 JSON under `vigil-design-engine:site:v1` after successful hydration. Invalid saved data is preserved instead of being overwritten; explicit Save local draft replaces it. Unavailable/quota-limited storage produces a visible export fallback. Local browser storage is convenience persistence for one internal workspace, not collaborative/cloud storage. Exported JSON is intended for version control in customer repositories. Customers supply their own assets/fonts and mount `SitePagePreview` using their application router; automatic repository/route creation, SEO application and publication remain host responsibilities.

## Verification and intentionally deferred scope

The complex fixture has 15 pages: Home, About, Services with Web Design/SEO/Automation, Work with Project Alpha/Beta, Shop with Apparel and Product Alpha/Beta plus Accessories, and Contact. Pages use existing Navigation/Hero, Story 004, Work 005, Services 006, Commerce 007 and Proof 008 components with independent payloads. It is a manually authored QA document, not a recipe or automatic sitemap.

See [verification and evidence](page-architecture/VERIFICATION.md) for tests, actual Lab/browser observations, mobile/keyboard checks and limitations. Recipes/detail grammars, dynamic collections/CMS, AI composition, Collection 009, overlays, the dedicated Motion Engine, automation, Express generation and Scar remain deferred. Navigation component count/hierarchy bounds are intentional capabilities; the page model itself supports deeper hierarchies.
