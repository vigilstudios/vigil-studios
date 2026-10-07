# Contextual production actions

Current contract, 5 October 2026. The [individual Production audit](action-integration/AUDIT.md) covers 73 Production systems and nine other runtime predecessors. Registration counts and lifecycle statuses are unchanged. Contextual actions extend the existing Page & Site foundation; dedicated Collection 012 conversion sections remain a separate future collection.

## Destination and presentation

`site/action-schema.ts` remains the only destination union: `page`, `section`, `external`, `email`, `phone`, `download`. `site/actions.ts::resolveAction` validates and resolves every contextual destination, including standalone external examples. Internal targets require a Site Definition. Future booking, modal, product, project, service, cart or checkout behavior requires an explicit new union member, validator and resolver; none is implemented here.

The optional section envelope `contextualActions` holds primary/secondary `ActionSlot`s and stable item slots. A disabled slot may be `{ enabled: false }` or retain its optional label/destination/presentation for re-enabling; an enabled slot requires a nonempty label and typed action, with optional presentation. Absence restores the component's authored fallback; disabling hides it and preserves configured fields. Existing `actions` path bindings remain compatible.

```json
{
  "contextualActions": {
    "primary": {
      "enabled": true,
      "label": "Start project",
      "action": { "type": "page", "pageId": "page-contact" },
      "presentation": { "variant": "outline", "size": "medium", "icon": "arrow-up-right" }
    },
    "secondary": { "enabled": false },
    "items": [{
      "group": "entries", "itemId": "web-design", "display": "link",
      "slot": {
        "enabled": true, "label": "Explore web design",
        "action": { "type": "page", "pageId": "page-web-design" },
        "presentation": { "variant": "underline", "size": "small" }
      }
    }]
  }
}
```

Item identities are existing `id`/`productId` values inside a declared content group, never array positions or routes. Reordering retains destinations. Missing identities remain loadable for explicit repair and block the affected rendered page. Disabled collection links retain the collection heading.

## Canonical capabilities

`SectionContract.actions`, attached to existing registry `composition` metadata, is authoritative. `actions/capabilities.ts` contains the individual audit: classification, rationale, supported primary/secondary presentation choices, and item group/path/identity/display contracts. It normalizes to serializable metadata. The family contract objects retain their canonical registry identity. There is no second inspector-only capability registry.

Classifications are `no-action`, `section-primary-action`, `section-primary-secondary-actions`, `per-item-action`, `mixed-action`. Item display declarations distinguish `link`, `media` and `whole-item`. Existing navigation menu, utility, attribution, source and evidence-disclosure interactions remain independent.

`parseSection` rejects unsupported slots, presentation choices and interaction modes. `actionItems` resolves declared records; `itemActionDisplays` further restricts a collection with video controls to a visible link. A media action has no button presentation. Missing records are diagnostics, not automatically rebound to a replacement entity.

## Presentation vocabulary

Every choice is finite and capability-aware. The supported operational vocabulary is:

| Property | Choices / behavior |
| --- | --- |
| Enabled | Show or hide the selected contextual action; absent configuration restores authored fallback |
| Label | Nonempty visitor-facing text, at most 120 characters |
| Destination | Page, Section, external HTTP(S), email, phone, download |
| Visual style | Primary, secondary, outline, ghost, text, underline, inverse |
| Size | Small, medium, large where supported; `display` is reserved in the schema and deliberately offered by no current component |
| Alignment | Left, center, right on compatible section groups; hero/scene alignment remains structural and is not exposed as a CTA position control |
| Width | Auto, full on compatible section slots; editorial/item actions retain auto width |
| Icon | None, or one of the 20 standardized typed Vigil icon names |
| Icon position | Leading, trailing; position control appears only with an icon |
| Surface | Inherit, light, dark, brand; explicit surfaces provide an ink/ground pair, and inverse reverses it |
| Shape | Existing art-direction/brand radius tokens; no arbitrary radius input |
| Item display | Visible link, principal-image link, whole-item stretched link, only where declared |

Icon identifiers: arrow-left, arrow-right, arrow-up-right, calendar, check, chevron-down, close, download, external-link, help, mail, map, menu, minus, phone, play, plus, search, upload, user. `VigilIcon` uses the current icon provider/pack and marks these decorative; the action label supplies the accessible name.

H12 limits its primary to text/underline/outline/inverse and small/medium; its secondary is editorial. Other production heroes allow the seven variants and three sizes, but retain their authored position/alignment. Editorial and item actions generally allow text/underline/ghost, small/medium and auto width. Collection Atlas heading actions allow text/underline, inherit heading typography/scale and offer no independent size control. Regular continuation slots allow the full vocabulary. Read each contract rather than inferring supported choices from a category.

`DesignButton` supplies native anchor/button semantics and the shared interaction foundation. `SectionActions`, `PrimaryAction`, `ItemAction`, `ActionMedia` consume contextual slots through `SectionActionProvider`. `renderSection` provides the section context automatically; `SitePagePreview`/`ActionBoundary` supplies `ActionSiteProvider`. A standalone host rendering typed internal actions must supply its Site Definition and use `renderSection` (or the two providers around direct section rendering).

Typography follows the accent/body role. Radius, accent/contrast pairs and elevation follow client tokens and art direction. Automatic defaults follow block/line/pill art-direction action tendencies; secondary/item defaults remain restrained. Explicit light/dark surfaces use neutral contrasting pairs; brand uses the current client's accent pair. Scene inheritance respects scene ink. Client-supplied colors and photographs still need contrast review in their actual composition.

## Composition Lab and Design Lab

Composition → Section → **Contextual actions** presents only supported slots, labelled item records, enable/label/destination controls and permitted display/presentation choices. Changes commit through normal serialized section updates. Apply CTA settings changes presentation; Apply typed action changes destination plus the current settings. Restore component's authored action removes the override. Hover/focus on presentation choices auditions the actual section; Escape/pointer exit restores it without saving.

Page choices use the real ordered Site Definition with nested `↳` labels and readable derived routes. Values are stable page IDs. Section actions first select a page, then an effective section in that page, including inherited/replaced globals; values remain Page + Section IDs. Changing the selected page resets the section picker. External editors validate protocols, email, phone and download filenames. Downloads carry native attributes in server markup; browser cross-origin download rules still apply.

Design → Component exposes capability classification/rationale and optional presentation inspection using a labelled external example. Production metadata also shows the canonical capability object. Destination authoring belongs in Composition. Creative study/reference workspaces are untouched; Design examples are transient inspection state.

## Routing, persistence and compatibility

Slug changes and reparenting derive new hrefs at render time from stable entities. `actionIssues`, deletion impact, page duplication/self-link retargeting and `materializeActions` include contextual slots. Broken pages/sections/items surface in QA and block the affected page preview. Standalone unresolved actions render an unavailable, non-navigating state with a readable reason. No stale legacy href is used silently.

Site/Page/Section JSON contains destination identities, enabled state, label, presentation and item display. Version 1 remains valid: optional fields require no migration. Resolved hrefs, React nodes, audition, editor selection and viewport are not persisted. Existing raw href payloads/path bindings retain behavior and validation; contextual overrides take precedence in their rendered slot. Existing raw/button primitives remain supported, and legacy path-bound downloads retain their adapter.

## Interaction and responsive requirements

Actions navigate with native anchors; selectors, disclosures, pause/video controls and form submissions remain buttons/native controls. Media links wrap only the principal image with one explicit accessible label. Whole-item modes use a single visible stretched anchor on audited control-free rows/figures/entries. No synthetic click handler, duplicate hidden link or interactive nesting is introduced.

The foundation maintains 44px minimum targets, wrapping labels/icons, visible keyboard focus, disabled/unavailable semantics, currentColor icons and reduced-motion behavior. Hover adds a restrained underline/icon translation only where motion permits. Narrow containers stack section actions; button treatments fill available width, while text/underline treatments preserve their alignment and reading rhythm. Required QA includes long labels at 1920/1440/768/390/320px, keyboard navigation, native download/external semantics, image/whole-item integrity and contrast on actual surfaces.

Future components must follow the [contribution contract](COMPONENT_CONTRIBUTION.md), declare the semantic decision including intentional actionlessness, and verify every exposed choice. See [milestone verification](action-integration/VERIFICATION.md) for evidence and the connected 15-page QA fixture.
