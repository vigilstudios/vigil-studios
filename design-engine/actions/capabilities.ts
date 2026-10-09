import { buttonShapes, hoverEffects } from "../presentation/schema";
import { coreIconNames } from "../icons/names";
import type { SectionInstance } from "../composition/schemas";
import type { ActionPresentation, ContextualActions } from "./schema";

export type PresentationCapability = { [K in keyof ActionPresentation]?: readonly NonNullable<ActionPresentation[K]>[] };
export type ItemActionCapability = { group: string; label: string; path: readonly string[]; identity: "id" | "productId"; displays: readonly ("link" | "media" | "whole-item")[]; presentation: PresentationCapability };
export type ActionCapabilities = {
  classification: "no-action" | "section-primary-action" | "section-primary-secondary-actions" | "per-item-action" | "mixed-action";
  reason: string;
  primary?: PresentationCapability;
  secondary?: PresentationCapability;
  items: readonly ItemActionCapability[];
};
const editorial: PresentationCapability = { variant: ["text", "underline", "ghost"], size: ["small", "medium"], width: ["auto"], surface: ["inherit", "light", "dark", "brand"] };
const regular: PresentationCapability = { variant: ["primary", "secondary", "outline", "ghost", "text", "underline", "inverse"], size: ["small", "medium", "large"], alignment: ["left", "center", "right"], width: ["auto", "full"], surface: ["inherit", "light", "dark", "brand"] };
const hero: PresentationCapability = { ...regular, alignment: undefined };
const item = (group: string, label: string, path: string[] = [group], displays: ItemActionCapability["displays"] = ["link"], identity: ItemActionCapability["identity"] = "id"): ItemActionCapability => ({ group, label, path, identity, displays, presentation: editorial });
function capability(reason: string, primary?: PresentationCapability, items: ItemActionCapability[] = [], secondary?: PresentationCapability): ActionCapabilities {
  return { classification: items.length ? primary ? "mixed-action" : "per-item-action" : secondary ? "section-primary-secondary-actions" : primary ? "section-primary-action" : "no-action", reason, primary, secondary, items };
}
const opening = (compact = false) => capability("Actions remain in the authored copy, joint, baseline or scene context; scene alignment belongs to the composition.", compact ? { ...hero, size: ["small", "medium"], variant: ["text", "underline", "outline", "inverse"] } : hero, [], compact ? editorial : hero);
const menu = capability("The existing page-derived menu, logo and utilities retain native navigation; one contextual CTA uses its authored action rail.", { ...editorial, variant: ["primary", "outline", "text", "underline", "inverse"] });
const section = (reason: string, items: ItemActionCapability[] = []) => capability(reason, regular, items);
const story = (reason: string) => capability(reason, editorial);
const work = (group: string, label: string, displays: ItemActionCapability["displays"] = ["link", "media"]) => section("A contextual collection link follows the title; record destinations remain separate from selection, pagination and comparison controls.", [item(group, label, [group], displays)]);
const service = (group: string, label: string, displays: ItemActionCapability["displays"] = ["link"]) => section("Optional service-index continuation follows the complete service content; each stable record owns its destination without replacing its inspection controls.", [item(group, label, [group], displays)]);
const product = (group: string, path: string[]) => section("Product/collection destinations use generic page actions; no cart or checkout behavior. Inspection and option controls remain buttons.", [item(group, "Product", path, ["link"], "productId")]);

/** Individually audited inventory, including composition-capable experimental predecessors. */
const authoredActionCapabilities: Record<string, ActionCapabilities> = {
  "proof.social-reach": section("Optional collaboration or media-kit action follows metrics and native social profile destinations."),
  "about.creator-profile": story("A personal collaboration action follows the biography and interests."),
  "cta.editorial": capability("Two optional conversion actions stay with the measured proposition.", regular, [], regular),
  "cta.signal": capability("Primary and optional secondary conversion actions occupy opaque copy, never unreadable imagery.", {...regular,size:["small","medium","large","display"]}, [], regular),
  "contact.inquiry": capability("Optional booking/email/management and media-kit actions complement a contact directory and real submission boundary.", regular, [], regular),
  "footer.sitemap": capability("Optional site continuation complements typed site-tree, social and legal destinations.", regular),
  "footer.compact": capability("Optional restrained continuation; compact navigation is derived from real page identities.", editorial),
  "footer.split": capability("Optional conversion action lives in the brand card, separate from newsletter submission.", regular),
  "footer.banner": capability("Optional conversion action follows the banner; newsletter and site destinations remain independent.", regular),
  "work.expand-rail": work("works","Image",["link"]),
  "work.card-rail": work("works","Card",["link"]),
  "work.image-expansion": work("works","Media",["link"]),
  "work.image-gallery": work("works","Media",["link"]),
  "work.apple-cards": work("works","Media",["link"]),
  "work.liquid-glass": work("works","Media",["link"]),
  "hero.image-marquee": capability("Optional primary/secondary actions stay in the proposition; image destinations belong in the canonical collection, never moving copies.", hero, [item("images","Image")],hero),
  "story.process-timeline": section("Optional continuation and independent process-step destinations use stable IDs.",[item("steps","Step")]),
  "work.image-sphere": work("images","Image",["link"]),
  "navigation.primary": menu, "navigation.island": menu, "navigation.contents": menu,
  "navigation.datum": menu, "navigation.meridian": menu, "navigation.dispatch": menu,
  "navigation.pocket-dock": menu, "navigation.viewfinder": menu, "navigation.switchboard": menu,
  "navigation.atlas-hall": menu, "navigation.folio-takeover": menu, "navigation.margin-rail": menu,
  "navigation.threshold": menu, "navigation.channel-directory": menu, "navigation.open-doors": menu,
  "hero.statement": opening(), "hero.object-study": opening(), "hero.vertical-record": opening(),
  "hero.front-page": opening(), "hero.open-circuit": opening(), "hero.between-acts": opening(),
  "hero.assembly": opening(), "hero.comparison": opening(true),
  "hero.full-scene": opening(), "hero.scene-poster": opening(),
  "content.feature-list": section("An optional section continuation follows the feature list; features themselves explain benefits rather than imply pages."),
  "story.object-biography": story("A restrained continuation follows the complete artifact dossier."),
  "story.working-conversation": story("An optional team/story link follows the complete transcript, preserving turn-taking."),
  "story.decision-ledger": capability("The principle/tension/practice ledger is a complete explanation; disclosures already reveal its rationale."),
  "story.manifesto-fold": capability("The manifesto is a complete statement, with an intentionally uninterrupted ending."),
  "story.open-letter": story("A restrained reply or story link belongs after the signature/postscript."),
  "story.material-relay": story("One process continuation follows the complete three-stage relay; decorative material plates stay actionless."),
  "work.open-index": work("projects", "Project", ["link", "media"]),
  "work.project-chapters": work("chapters", "Chapter"),
  "work.contact-room": work("frames", "Frame"), "work.screening-room": work("frames", "Frame"),
  "work.photographic-promenade": work("scenes", "Scene"),
  "work.gallery-hanging": work("works", "Work", ["link", "media", "whole-item"]),
  "work.campaign-folio": work("spreads", "Campaign spread"),
  "work.look-closer": work("pairs", "Image pair", ["link"]),
  "work.campaign-score": work("chapters", "Campaign chapter"),
  "work.media-cabinet": work("records", "Media record", ["link"]),
  "work.light-table": work("images", "Image", ["link"]),
  "work.viewport-gallery": capability("Its viewport toolbar and detail disclosures own the gallery; optional links belong inside each open detail panel.", undefined, [item("pieces", "Piece")]),
  "services.offering-index": service("entries", "Offering", ["link", "whole-item"]),
  "services.capability-manifesto": capability("A complete capability promise and its boundaries should remain an uninterrupted manifesto."),
  "services.capability-desk": service("capabilities", "Capability"),
  "services.expandable-offerings": service("services", "Service"),
  "services.situation-responses": section("A section continuation can open the services index; friction/response statements are not destination entities."),
  "services.delivery-journey": service("stages", "Delivery stage"),
  "services.capability-coverage": capability("The aligned capability matrix conveys coverage, not distinct service-page entities; its phase controls remain inspection tools."),
  "services.connected-capabilities": service("layers", "Capability layer"),
  "services.service-field-atlas": service("plates", "Service", ["link", "media"]),
  "services.evidence-in-practice": service("cases", "Practice case"),
  "services.starting-point": service("paths", "Recommendation"),
  "services.scope-companions": service("offerings", "Offering"),
  "commerce.merchant-edit": product("products", ["items", "product"]),
  "commerce.catalog-ledger": product("products", ["products"]),
  "commerce.object-pedestal": product("products", ["product"]),
  "commerce.release-signal": product("products", ["product"]),
  "commerce.collection-atlas": section("Collection headings retain their typography role; imagery and whole entries can navigate to stable collection pages.", [{...item("collections", "Collection", ["collections"], ["link", "media", "whole-item"]),presentation:{...editorial,variant:["text","underline"],size:undefined}}]),
  "commerce.look-objects": product("products", ["products"]),
  "commerce.campaign-interleave": product("products", ["spreads", "product"]),
  "commerce.material-anatomy": product("products", ["product"]),
  "commerce.origin-receipt": product("products", ["product"]),
  "commerce.inspection-desk": product("products", ["product"]),
  "commerce.vertical-product-folio": product("products", ["product"]),
  "commerce.option-atelier": product("products", ["product"]),
  "commerce.comparison-bench": product("products", ["products"]),
  "commerce.companion-rail": section("Anchor and related product records keep their distinct destinations.", [item("products", "Product", ["relatedProducts", "product"], ["link"], "productId"), item("anchor", "Anchor product", ["anchor"], ["link"], "productId")]),
  "proof.margin-voice": capability("One attributed voice is the evidence; existing attribution/source links suffice without a conversion CTA."),
  "proof.outcome-equation": story("A contextual case-study link follows the measurement explanation and attribution."),
  "proof.change-dossier": story("A contextual full-case link follows the baseline/intervention/outcome and limitations."),
  "proof.case-cross-section": capability("The existing case footer owns its case destination; no duplicate section CTA.", undefined, [item("case", "Case study", ["case"])]),
  "proof.credential-library": capability("Credential verification sources belong to each evidence disclosure; a marketing CTA would weaken the accession record."),
  "proof.moving-chorus": capability("E06 retains its seamless continuous-motion architecture and complete accessible still view; contextual CTAs would interrupt the chorus."),
  "proof.review-reading-room": capability("Reviews remain evidence, with original source/author links and sample-selection context."),
  "proof.in-conversation": story("An optional customer-story continuation follows the complete interview."),
  "proof.relationship-register": section("A customer-stories continuation can follow the complete register; optional relationship destinations sit with the organization record.", [item("relationships", "Relationship")]),
  "proof.progress-trail": story("One result/case continuation follows the full measurement trail and basis."),
  "proof.evidence-desk": story("One full-case continuation follows the claim, artifacts and qualification; artifact selection remains inspection."),
  "proof.story-switchboard": section("Customer-story links belong to each selected story and accessible reading summary.", [item("stories", "Customer story")]),
};
export const actionCapabilities = Object.fromEntries(Object.entries(authoredActionCapabilities).map(([id, value]) => {
  const icons = (presentation: PresentationCapability) => ({ ...presentation, variant: ["primary", "secondary", "outline", "ghost", "text", "underline", "inverse"], size: ["small", "medium", "large", "display"], shape: buttonShapes, hover: hoverEffects, icon: coreIconNames, iconPosition: ["leading", "trailing"] });
  return [id, JSON.parse(JSON.stringify({ ...value, ...(value.primary ? { primary: icons(value.primary) } : {}), ...(value.secondary ? { secondary: icons(value.secondary) } : {}), items: value.items.map(item => ({ ...item, presentation: icons(item.presentation) })) }))];
})) as Record<string, ActionCapabilities>;
export function getActionCapabilities(id: string): ActionCapabilities {
  const capability = actionCapabilities[id];
  if (!capability) throw new Error(`Missing action audit: ${id}`);
  return capability;
}
export function actionItems(section: SectionInstance, group: ItemActionCapability): { id: string; label: string; record: Record<string, unknown> }[] {
  let records: unknown[] = [section.content];
  for (const key of group.path) records = records.flatMap(value => {
    const next = value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined;
    return Array.isArray(next) ? next : next ? [next] : [];
  });
  return records.filter((value): value is Record<string, unknown> => !!value && typeof value === "object").map(value => ({ id: String(value[group.identity]), label: String(value.title ?? value.client ?? value.organization ?? value[group.identity]), record: value }));
}
export function itemActionDisplays(section: SectionInstance, group: ItemActionCapability, itemId: string): ItemActionCapability["displays"] {
  const record = actionItems(section, group).find(item => item.id === itemId)?.record;
  const media = record?.media;
  return media && typeof media === "object" && "kind" in media && media.kind === "video" ? group.displays.filter(display => display === "link") : group.displays;
}
export function validateContextualActions(section: SectionInstance, value?: ContextualActions): void {
  if (!value) return;
  const capability = getActionCapabilities(section.component);
  const check = (slot: ContextualActions["primary"], allowed?: PresentationCapability) => {
    if (!slot) return;
    if (!allowed) throw new Error(`${section.component} does not support this action slot.`);
    if (!slot.enabled && !slot.presentation) return;
    for (const [key, choice] of Object.entries(slot.presentation ?? {})) {
      if (key === "icon" && choice === null) continue;
      const options = allowed[key as keyof PresentationCapability];
      if (!options?.includes(choice as never)) throw new Error(`Unsupported action presentation: ${key}=${choice}`);
    }
  };
  check(value.primary, capability.primary); check(value.secondary, capability.secondary);
  for (const configured of value.items ?? []) {
    const group = capability.items.find(group => group.group === configured.group);
    if (!group || !itemActionDisplays(section, group, configured.itemId).includes(configured.display)) throw new Error("Unsupported item action display.");
    if (configured.display === "media" && Object.keys(configured.slot.presentation ?? {}).length) throw new Error("Media actions use the authored media surface, without button presentation.");
    check(configured.slot, group.presentation);
    // Missing records remain loadable, so the editor can explicitly repair stale identities.
  }
}
