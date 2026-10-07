import { getActionCapabilities } from "../actions/capabilities";
import type { SectionContract } from "./contracts";
import type { CommerceSectionId } from "./commerce-schemas";
import type { TypographyProfileId } from "../foundations/typography/profiles";
import type { ArtDirectionId } from "../foundations/art-direction";
type CommerceDescriptor = {
  id: string;
  name: string;
  family: string;
  scale: string;
  usage: NonNullable<SectionContract["usage"]>;
  typography: readonly TypographyProfileId[];
  art: readonly ArtDirectionId[];
  dna: string;
  content: string;
  media: string;
  mobile: string;
  interaction: string;
  motion: string;
  limitations: string;
  compatibility: string;
  rejected: string;
  axes: readonly string[];
  shortlist?: {
    why: string;
    implementation: string;
    responsive: string;
    interaction: string;
    pages: string;
  };
};
export const commerceDescriptors: readonly CommerceDescriptor[] = [
  {
    id: "P01",
    name: "The merchant’s edit",
    family: "Product discovery",
    scale: "Boutique 5–30; 3–5 curated items per section",
    usage: "section-and-page-capable",
    typography: ["editorial", "playful", "neo-grotesk"],
    art: ["publication", "salon", "precision"],
    dna: "One editorial lead, a written buying perspective, and a smaller supporting index. Merchandising allocates attention instead of giving every product equal weight.",
    content:
      "editorialNote + 3–5 {product, note}; each product carries identity, price, optional sale comparison, category, availability, media and destination.",
    media:
      "One product image each; landscape and portrait remain contained. The lead may be model photography; no hard crop required.",
    mobile:
      "Lead image and product stay paired; supporting products become a compact two-column shelf with full-width editorial note between them.",
    interaction: "Native product links use typed host-owned destinations.",
    motion:
      "Propose StaggerReveal for supporting items; lead visible at rest. None implemented.",
    limitations:
      "Curated attention cannot substitute for exhaustive catalog browsing. Five items maximum.",
    compatibility:
      "Inset document flow; quiet navigation and Front Page Hero, Open Letter before, compact CTA after. Avoid a second asymmetric image index immediately adjacent.",
    rejected: "Equal-size product cards with a magazine heading.",
    axes: [
      "editor selection",
      "lead and side shelf",
      "mixed product plates",
      "low",
      "destination links",
      "price beside identity",
      "buyer commentary",
      "unequal pauses",
    ],
    shortlist: {
      why: "A reusable merchandising entry point with genuine lead/support hierarchy.",
      implementation: "Medium: distinct lead and supporting item slots.",
      responsive: "Medium: authored editorial reading order and compact shelf.",
      interaction: "Low: product destinations only.",
      pages: "Shop, Collection, Campaign landing sections",
    },
  },
  {
    id: "P02",
    name: "Catalog ledger",
    family: "Product discovery",
    scale: "Large catalog; bounded 5–24 row slice, host pagination later",
    usage: "page-capable",
    typography: ["technical", "neo-grotesk", "brutalist"],
    art: ["precision", "precision", "billboard"],
    dna: "A searchable-looking but explicitly bounded catalog register prioritizes category, availability and price in aligned scan lines. A native filter disclosure leaves the product index dominant.",
    content:
      "products[5–24] + totalCatalogLabel; local category/availability filter and price order work only on this fixture slice.",
    media:
      "Small optional product thumbnails. Image absence preserves row identity and measurements.",
    mobile:
      "Rows become a two-line register: thumbnail/title then category/status/price. Filters use a native disclosure; no horizontal table drag.",
    interaction:
      "Category, available-only and sort controls update fixture rows and announce count. No network search or pagination engine.",
    motion:
      "None proposed; row positions remain stable until an explicit filter/sort action.",
    limitations:
      "Displayed total is a demo label, not a live inventory total. Real facets, pagination, URL state and result announcements require a host adapter.",
    compatibility:
      "Dense inset document flow; Contents Navigation and Open Circuit Hero. Follow with an open Story or Media section to relieve density.",
    rejected: "Tiny versions of a standard product card grid.",
    axes: [
      "facet narrowing",
      "aligned row register",
      "thumbnail optional",
      "high",
      "filter and sort",
      "availability and sale",
      "taxonomy",
      "regular scan lines",
    ],
    shortlist: {
      why: "Proves a catalog-scale discovery vocabulary independent of card grids.",
      implementation: "Medium: bounded register; adapter owns server results.",
      responsive: "Medium: row fields regroup without a sideways table.",
      interaction: "Medium: filter/sort state and announcements.",
      pages: "Shop, Category, Search Results",
    },
  },
  {
    id: "P03",
    name: "Object pedestal",
    family: "Featured product",
    scale: "One flagship; boutique or curated store",
    usage: "section-oriented",
    typography: ["luxury", "fashion", "geometric"],
    art: ["gallery", "salon", "gallery"],
    dna: "An isolated central object is flanked by a quiet specification marginalia and edition note. Price is a small part of the object record, not the dominant headline.",
    content:
      "product + edition + 2–4 labelled specifications; no options required.",
    media:
      "One complete object image, ideally a cutout or studio photograph. Contains portrait model images without manufacturing a cutout.",
    mobile:
      "Object comes first, followed by a horizontal specification strip and a concise title/price record. Marginalia do not become long stacked panels.",
    interaction: "Native product destination; readable specification list.",
    motion:
      "Propose restrained MediaReveal of the object. No rotation, magnetic button or parallax.",
    limitations:
      "One product only; not a complete information or purchase module.",
    compatibility:
      "Open inherited inset flow. Pair with restrained navigation, Object Biography or Material Relay. Avoid placing directly after Object Study Hero without a smaller scale interval.",
    rejected: "Standard two-column image and buy box.",
    axes: [
      "single-object focus",
      "center with marginalia",
      "whole studio object",
      "very low",
      "destination link",
      "quiet edition price",
      "object qualities",
      "radial whitespace",
    ],
  },
  {
    id: "P04",
    name: "Release signal",
    family: "Featured product / drop",
    scale: "One launch product per signal",
    usage: "section-oriented",
    typography: ["poster", "brutalist", "poster"],
    art: ["billboard", "billboard", "billboard"],
    dna: "A bold release statement sits above a wide campaign exposure; a hard-edged ticker-like release strip carries date, price and availability. No countdown or invented urgency.",
    content:
      "statement + release label + campaignMedia + product. Release is authored text, not a computed clock.",
    media:
      "Large campaign image or user-started video; separate product media remains available at destination.",
    mobile:
      "Poster typography scales down; the campaign becomes a short landscape exposure and release strip wraps into labelled cells, with a large product link.",
    interaction:
      "Product destination and native video controls when supplied. No automatic advancement.",
    motion:
      "Propose MediaReveal; a moving ticker is deliberately rejected. All release information remains static.",
    limitations:
      "Cannot imply scarcity or release timing from missing data. Not a hero replacement or whole launch page.",
    compatibility:
      "Full-width opaque document flow; quiet Primary Navigation and a restrained Hero. Pair with a calm Origin receipt; avoid Campaign Score or a second poster immediately adjacent.",
    rejected: "Countdown timer above three generic cards.",
    axes: [
      "launch attention",
      "poster exposure and ticker",
      "wide campaign",
      "low",
      "release destination",
      "date and availability",
      "launch statement",
      "compressed burst",
    ],
  },
  {
    id: "P05",
    name: "Collection atlas",
    family: "Collection / category",
    scale: "3–5 categories into medium/large stores",
    usage: "page-capable",
    typography: ["neo-grotesk", "luxury", "humanist"],
    art: ["runway", "publication", "gallery"],
    dna: "Alternating category bands join oversized collection names, small product counts and unequal image windows. It is a directory of worlds rather than a list of products.",
    content:
      "collections[3–5]: id, title, description, media, productCount, destination. Counts are host-supplied.",
    media:
      "One representative landscape or portrait image per category; contains whole image and preserves natural ratio.",
    mobile:
      "Names become the index spine; image windows alternate 80/65 percent widths. Counts and descriptions stay attached to their category.",
    interaction: "Native collection links use typed host-owned destinations.",
    motion:
      "Propose alternating MediaReveal with stationary labels; never scroll pin categories.",
    limitations:
      "Needs meaningful taxonomy; more than five categories should use a future dense directory.",
    compatibility:
      "Full-width document flow; Primary / Island Navigation, Statement Hero, Open Letter or compact Offering Index neighbors. Avoid a neighboring photographic atlas.",
    rejected: "Three identical image category cards.",
    axes: [
      "world selection",
      "alternating named bands",
      "unequal category windows",
      "medium",
      "category destinations",
      "category counts",
      "assortment rationale",
      "long-short alternation",
    ],
    shortlist: {
      why: "Connects commerce taxonomy to visual collection storytelling.",
      implementation: "Low–medium: category-specific records and destinations.",
      responsive: "Medium: alternating widths and label ownership.",
      interaction: "Low: collection links.",
      pages: "Shop, Collections, Category directory",
    },
  },
  {
    id: "P06",
    name: "Look / objects",
    family: "Fashion / shop-the-look",
    scale: "Boutique 1–3 looks; 2–4 products per look",
    usage: "section-and-page-capable",
    typography: ["fashion", "humanist", "technical"],
    art: ["runway", "salon", "precision"],
    dna: "A campaign plate and a numbered product legend share one editorial spread. Each item has an authored role in the look; selection opens the corresponding product record without hotspot clutter.",
    content:
      "One pool of 2–12 products and 1–3 looks: campaignMedia, caption and 2–4 items {productId, role} each. Every item references the pool; one product may occur in multiple looks.",
    media:
      "Model/campaign photograph for apparel; a ritual plate or listening setup for other contexts. Products may share an honestly labelled campaign fixture.",
    mobile:
      "Campaign remains first, then a wrapping numbered legend and selected item with price and status. All products are keyboard reachable; no image coordinates needed.",
    interaction:
      "Look buttons change the whole relationship; item buttons expose role, price and destination with pressed states and a polite title announcement.",
    motion:
      "Propose restrained selected-product crossfade as future capability; immediate swap now. No moving hotspots.",
    limitations:
      "The fixture image is illustrative, not proof that every SKU is visually exact. Real campaigns need an editorial mapping and separate packshots.",
    compatibility:
      "Inset document flow, no sticky ownership. Quiet navigation/hero, Campaign Folio and a compact product index. Avoid a second large split spread adjacent.",
    rejected: "Floating price dots over a fashion image.",
    axes: [
      "look membership",
      "scene plus numbered legend",
      "model and item relationship",
      "medium",
      "look and item selection",
      "role-specific item price",
      "outfit or ritual",
      "sustained scene",
    ],
    shortlist: {
      why: "Establishes real campaign-to-product relationships and accessible fashion discovery.",
      implementation: "Medium–high: stable product references across looks.",
      responsive: "Medium: retains scene/legend/selected-record relationship.",
      interaction: "Medium: coordinated look and item selection.",
      pages: "Lookbook, Campaign, Collection",
    },
  },
  {
    id: "P07",
    name: "Campaign interleave",
    family: "Fashion / editorial commerce",
    scale: "2–4 editorial chapters; one product per chapter",
    usage: "page-capable",
    typography: ["brutalist", "editorial", "fashion"],
    art: ["publication", "runway", "publication"],
    dna: "A filmstrip-like horizontal sequence alternates campaign narratives and narrow product colophons. Reading progresses through scenes; products punctuate the story rather than control it.",
    content:
      "spreads[2–4]: title, story, campaignMedia, one product. Order is editorial, not a recommendation ranking.",
    media:
      "Mixed-size campaign photographs; portraits remain whole. Video is user-started only.",
    mobile:
      "Each scroll-snap panel is a scene above a compact product colophon; a visible next panel and previous/next controls communicate sequence.",
    interaction:
      "Native horizontal overflow, keyboard-focusable region and previous/next controls. No wheel hijacking.",
    motion:
      "Existing HorizontalScroll vocabulary could be reused; current movement is immediate native scrolling, including reduced motion.",
    limitations:
      "Not for exhaustive products or long articles. Avoid nested horizontal regions.",
    compatibility:
      "Full-width horizontal region, no sticky ownership. In-flow navigation and quiet Hero; adjacent sections should scroll vertically.",
    rejected: "Another campaign image controlling a product list like P06.",
    axes: [
      "ordered campaign reading",
      "scene-colophon sequence",
      "wide sequential frames",
      "low",
      "native horizontal progression",
      "one product per chapter",
      "campaign narrative",
      "cinematic intervals",
    ],
  },
  {
    id: "P08",
    name: "Material anatomy",
    family: "Product storytelling / inspection",
    scale: "One product; 3–5 material details",
    usage: "product-detail-building-block",
    typography: ["geometric", "technical", "luxury"],
    art: ["precision", "precision", "gallery"],
    dna: "An object overview sits beside a detail inspection well. Named material controls connect an enlarged detail to its purpose and an explicit evidence note.",
    content:
      "product + materials: id, name, detail, media, evidence. Evidence must distinguish authored illustration from substantiated material facts.",
    media:
      "Whole object plus authored close-ups; generated close-ups retain their reference object. Care returns to the whole-object view; no real magnification is implied.",
    mobile:
      "Overview reduces to a small reference; inspection image and material buttons take priority. Explanation remains visible directly below selection.",
    interaction:
      "Named buttons switch detail media and text; no pointer-only magnifier or drag requirement.",
    motion:
      "Future detail crossfade/zoom needs a commerce-specific capability; none implemented.",
    limitations:
      "Generated detail imagery needs replacement with verified macro photography for production. It does not certify sustainability, ingredients or material origin.",
    compatibility:
      "Inset opaque document flow. Pair with Object Biography, Decision Ledger or a quiet media gallery. No overlay navigation or sticky ownership.",
    rejected: "A row of feature icons next to a stock photograph.",
    axes: [
      "detail investigation",
      "overview and inspection well",
      "whole-to-detail pair",
      "medium",
      "material selection",
      "material evidence",
      "construction choices",
      "focused repeated attention",
    ],
    shortlist: {
      why: "Adds a material/feature storytelling primitive for product detail and landing sections.",
      implementation: "Medium: authored material/media/evidence relationships.",
      responsive: "Medium: reduces overview while preserving inspection.",
      interaction: "Medium: local selection with text fallback.",
      pages: "Product Detail, flagship landing, craftsmanship sections",
    },
  },
  {
    id: "P09",
    name: "Origin receipt",
    family: "Product storytelling",
    scale: "One product; 3–5 provenance stages",
    usage: "section-and-page-capable",
    typography: ["humanist", "geometric", "editorial"],
    art: ["publication", "gallery", "publication"],
    dna: "A readable material-to-object ledger pairs sequential origin notes with evidence labels. A narrow image margin and receipt footer keep provenance separate from promotional claims.",
    content:
      "product + ordered stages: title, place, story, evidence, optional media. No unverifiable certification badges.",
    media:
      "Optional source/process images; text-only stages are first-class. A studio fixture must not pose as a factory photograph.",
    mobile:
      "Stage number and place become a margin label; story, evidence and optional media follow together. No horizontal timeline.",
    interaction:
      "Static document reading and product destination; evidence is text, not a fake external citation.",
    motion:
      "Propose FadeReveal per complete stage, never hiding evidence under motion none.",
    limitations:
      "Supply-chain verification belongs to the brand; all current evidence is explicitly fictional or illustrative.",
    compatibility:
      "Inset document flow. Works after Material Relay only if their narratives differ; quiet hero, Open Letter or Contact Room neighbors.",
    rejected: "An unsupported sustainability badge grid.",
    axes: [
      "provenance reading",
      "numbered receipt spine",
      "optional process margin",
      "medium",
      "linear reading",
      "origin evidence",
      "material-to-object sequence",
      "measured document rhythm",
    ],
  },
  {
    id: "P10",
    name: "Inspection desk",
    family: "Product Detail / media",
    scale: "One product; 2–8 media entries",
    usage: "product-detail-building-block",
    typography: ["technical", "luxury", "neo-grotesk"],
    art: ["precision", "gallery", "precision"],
    dna: "One large primary viewing well is controlled by a labelled contact sheet. Media type, caption and source relationship stay explicit across stills, video and a truthful 360 placeholder.",
    content:
      "product + gallery: id, media union, caption. Video requires poster, dimensions, transcript and captions when speech exists.",
    media:
      "Whole stills, native controlled video, or a static interactive-media placeholder. 360 renderer is not implemented.",
    mobile:
      "Primary view first, wrapping thumbnail buttons below; no tiny sideways-only thumbnail track. Captions and type labels stay visible.",
    interaction:
      "Pressed thumbnail buttons select media; native video starts only on request. Replacing video unmounts it. Static 360 fallback explains unavailable interaction.",
    motion:
      "Propose restrained image swap; none now. Video never autoplays, including after selection.",
    limitations:
      "No lightbox, fullscreen overlay, zoom service or 3D loader. Host supplies optimized responsive sources and thumbnails.",
    compatibility:
      "Inset isolated media region with document flow. Fits with a later information block but does not implement a whole PDP. Avoid competing gallery controls immediately adjacent.",
    rejected: "A drag-only carousel with unlabeled thumbnails.",
    axes: [
      "media inspection",
      "primary and contact sheet",
      "image video placeholder",
      "medium",
      "thumbnail selection",
      "caption and product record",
      "view-by-view context",
      "stable viewing well",
    ],
    shortlist: {
      why: "Proves mixed-media product inspection with explicit accessible fallbacks.",
      implementation: "Medium–high: media lifecycle and delivery policy.",
      responsive: "Medium: contained images and labelled thumbnail grid.",
      interaction: "Medium–high: selection, video lifecycle; 360 deferred.",
      pages: "Product Detail, featured product, technical showcase",
    },
  },
  {
    id: "P11",
    name: "Vertical product folio",
    family: "Product Detail / media",
    scale: "One product; 2–6 authored plates",
    usage: "product-detail-building-block",
    typography: ["editorial", "fashion", "humanist"],
    art: ["runway", "publication", "gallery"],
    dna: "All product plates remain exposed in a vertical essay, with captions on a parallel rail and a compact repeated product reference. The reader controls pace through document scroll.",
    content:
      "product + plates: id, media, caption in authored order. No thumbnail or selected-image state.",
    media:
      "Portraits, wide shots, details or controlled video; natural ratios create the rhythm, no crop grid.",
    mobile:
      "Captions precede their image; images alternate full-width and inset at their intrinsic ratio. Product reference begins the sequence; nothing becomes sticky.",
    interaction:
      "Native document reading and video controls when supplied. No carousel.",
    motion:
      "Propose existing MediaReveal per plate; content fully visible in none/reduced motion.",
    limitations:
      "Longer page cost and more loaded media than P10; use lazy loading and finite plates. Not an infinite gallery.",
    compatibility:
      "Full-width document flow, no sticky ownership; suitable next to a future information section but never assumes global columns or a page recipe.",
    rejected: "Inspection desk with thumbnails moved to the side.",
    axes: [
      "continuous media reading",
      "all-visible vertical essay",
      "intrinsic varied plates",
      "low",
      "document scrolling",
      "repeated product identity",
      "captioned visual essay",
      "variable-height cadence",
    ],
  },
  {
    id: "P12",
    name: "Option atelier",
    family: "Product Detail / options",
    scale: "One product; 1–3 option groups, up to 40 supplied variants",
    usage: "product-detail-building-block",
    typography: ["playful", "neo-grotesk", "technical"],
    art: ["salon", "publication", "precision"],
    dna: "A tactile option worksheet makes size, color or configuration choices visible alongside an honest resolved-variant receipt. Unavailable and nonexistent combinations remain distinguishable.",
    content:
      "product + options with named values and optional swatch colors + variants referencing every option exactly once; variant price and availability; guidance.",
    media:
      "Optional single product reference image; a swatch is not proof of a matching variant photograph.",
    mobile:
      "Reference image shrinks to a swatch-like object record; radio groups wrap with 44px targets. Price/status receipt follows in normal flow.",
    interaction:
      "Native radio groups support arrow keys; resolve only supplied variant combinations. No cart action. Unmatched combination says no matching variant and never shows a false available price.",
    motion:
      "Propose a subtle selection outline transition; disabled under reduced motion. Current state change is instant.",
    limitations:
      "No inventory check, dependent-option engine, size recommendation, cart or purchase. A host must refresh availability and price before transaction.",
    compatibility:
      "Inset document flow; inherits brand/icons. Align with P10/P11 only through a future page composition contract, not a hard-coded PDP layout.",
    rejected: "Three generic dropdowns above an Add to cart button.",
    axes: [
      "configuration selection",
      "option worksheet and receipt",
      "small object reference",
      "high",
      "native radio groups",
      "resolved variant price",
      "choice guidance",
      "compact workbench",
    ],
  },
  {
    id: "P13",
    name: "Comparison bench",
    family: "Product comparison",
    scale: "Medium store; 2–4 comparable products, 3–8 shared criteria",
    usage: "section-and-page-capable",
    typography: ["neo-grotesk", "technical", "geometric"],
    art: ["precision", "precision", "precision"],
    dna: "A baseline product stays on the bench while a candidate can change. Criterion-aligned pairs expose practical differences, without an invented winner or scoring algorithm.",
    content:
      "products in a single currency + criteria with exactly one value per product. Missing values must be authored honestly.",
    media: "Small comparable object images; no matching camera angle required.",
    mobile:
      "Two compact product headings stay side by side; each criterion becomes a labelled two-column pair. Candidate select remains native, no table drag.",
    interaction:
      "Candidate selector excludes baseline; summary updates politely. Product destinations remain independent.",
    motion: "None proposed; stable comparison alignment takes priority.",
    limitations:
      "No cross-currency comparisons, computed scores or inferred specification matching. Adapter must normalize units.",
    compatibility:
      "Dense inset flow; quiet hero and an open Story neighbor. Avoid a dense Catalog ledger immediately adjacent.",
    rejected: "Three pricing-plan cards with checkmarks.",
    axes: [
      "tradeoff comparison",
      "baseline and candidate pairs",
      "paired object references",
      "high",
      "candidate selection",
      "aligned specifications and prices",
      "explicit tradeoffs",
      "stable comparative rhythm",
    ],
  },
  {
    id: "P14",
    name: "Companion rail",
    family: "Related-product discovery",
    scale: "Boutique/medium; one anchor + 2–6 related products",
    usage: "product-detail-building-block",
    typography: ["luxury", "playful", "poster"],
    art: ["gallery", "salon", "billboard"],
    dna: "An anchor product introduces a horizontal sequence of companions, each preceded by its reason for belonging. Relationship is the headline; product details follow.",
    content:
      "anchor + relatedProducts: product, relationship, reason. Distinct product IDs; no self-recommendation.",
    media:
      "Whole product photographs, including missing-image fallback. The rail works without lifestyle-perfect scenes.",
    mobile:
      "Anchor becomes a compact intro; one wide companion and a glimpse of the next scroll natively. Previous/next controls supplement swiping.",
    interaction:
      "Native horizontal overflow and previous/next controls; product destinations. No recommendation service.",
    motion:
      "Possible existing HorizontalScroll; current motion is immediate. No autoplay or marquee products.",
    limitations:
      "Relationships are authored, never algorithmically inferred. No bundled total or claim that items can be purchased together.",
    compatibility:
      "Horizontal region, no sticky ownership; useful after a vertical gallery or story. Do not nest within P07 or another horizontal region.",
    rejected: "A generic You may also like card grid.",
    axes: [
      "relationship discovery",
      "anchor with companion rail",
      "individual whole objects",
      "medium",
      "rail progression",
      "separate product prices",
      "authored reasons",
      "repeated relationship beats",
    ],
  },
];
export const commerceSectionIds = [
  "commerce.merchant-edit",
  "commerce.catalog-ledger",
  "commerce.object-pedestal",
  "commerce.release-signal",
  "commerce.collection-atlas",
  "commerce.look-objects",
  "commerce.campaign-interleave",
  "commerce.material-anatomy",
  "commerce.origin-receipt",
  "commerce.inspection-desk",
  "commerce.vertical-product-folio",
  "commerce.option-atelier",
  "commerce.comparison-bench",
  "commerce.companion-rail",
] as const satisfies readonly CommerceSectionId[];
const ranges = [
  [3, 5],
  [0, 24],
  [1, 1],
  [1, 1],
  [3, 5],
  [1, 3],
  [2, 4],
  [3, 5],
  [3, 5],
  [2, 8],
  [2, 6],
  [1, 3],
  [2, 4],
  [2, 6],
];
const scales: readonly SectionContract["commerce"][] = commerceDescriptors.map(
  (d, index) => ({
    merchandisingIntent: d.family,
    catalogScale:
      index === 1
        ? ["medium", "large"]
        : index === 4
          ? ["medium", "large"]
          : index === 12
            ? ["medium"]
            : index === 13
              ? ["boutique", "medium"]
              : ["boutique"],
    productDetail:
      index === 7
        ? ["storytelling"]
        : index === 9 || index === 10
          ? ["media"]
          : index === 11
            ? ["options"]
            : index === 13
              ? ["related-products"]
              : index === 2
                ? ["specifications"]
                : index === 8
                  ? ["storytelling"]
                  : [],
    providerBoundary: "normalized-presentation",
  }),
);
export const commerceContracts = Object.fromEntries(
  commerceSectionIds.map((id, index) => {
    const d = commerceDescriptors[index];
    return [
      id,
      {
        category: "commerce",
        usage: d.usage,
        commerce: scales[index],
        structuralDNA: `${d.id}: ${d.dna}`,
        contentSchema: id,
        mediaSchema: `${id}.authored-product-media`,
        contentConstraints: `${d.scale}. ${d.content} Strict schemas enforce bounds, unique identifiers, safe destinations, aligned prices, variants and product relationships.${index === 1 ? " Catalog accepts 0–24 returned rows, including empty results; 5–24 is the intended authored slice." : ""}`,
        itemRange: {
          min: ranges[index][0],
          max: ranges[index][1],
          unit: [
            "editorial products",
            "returned rows",
            "featured product",
            "launch product",
            "collections",
            "looks with 2–4 product references each",
            "chapters",
            "material details",
            "provenance stages",
            "gallery plates",
            "vertical plates",
            "option groups / at most 40 variants",
            "comparable products / 3–8 keyed criteria",
            "companions",
          ][index],
        },
        mediaRequirements: `${d.media} Dimensions and alt required; authored order, primary role and optional thumbnails/responsive candidates. Lazy stills and preload-none user-started video. Missing/failed media keeps identity and controls readable.`,
        variants: ["authored"],
        typography: {
          profiles: [
            "editorial",
            "luxury",
            "neo-grotesk",
            "geometric",
            "poster",
            "humanist",
            "technical",
            "brutalist",
            "playful",
            "fashion",
          ],
          roles: ["display", "heading", "body", "accent", "mono"],
          behavior:
            "Independent semantic roles; bounded product names, prices and controls retain the reviewed hierarchy.",
        },
        artDirections: [...new Set(d.art)],
        artBehavior:
          "Art changes section intervals, gutters and typography-independent rules; lead/support proportions, whole media, look relationships, comparison axes and sequence stay structural.",
        motion: ["none"],
        motionIntensities: ["none"],
        overrides: ["typography", "artDirection"],
        media: {
          geometries: ["contained"],
          tones: ["natural", "monochrome", "high-contrast"],
        },
        icons:
          index === 1
            ? ["plus", "arrow-up-right"]
            : index === 5
              ? ["arrow-right", "arrow-up-right"]
              : index === 6 || index === 13
                ? ["arrow-left", "arrow-right", "arrow-up-right"]
                : ["arrow-up-right"],
        interactionCapabilities:
          index === 1
            ? [
                "native-filter-disclosure",
                "bounded-slice-refinement",
                "controlled-host-query-intent",
                "result-announcement",
              ]
            : index === 5
              ? [
                  "look-selection",
                  "referenced-product-selection",
                  "polite-announcement",
                ]
              : index === 7 || index === 9
                ? [
                    "named-media-selection",
                    "polite-announcement",
                    "user-started-video",
                  ]
                : index === 11
                  ? [
                      "native-radio-options",
                      "controlled-selection-callback",
                      "supplied-variant-resolution",
                    ]
                  : index === 12
                    ? ["candidate-selection", "semantic-comparison-table"]
                    : index === 6 || index === 13
                      ? [
                          "native-horizontal-region",
                          "keyboard-and-touch-progression",
                        ]
                      : ["semantic-reading", "native-destinations"],
        compatibility: {
          flow: {
            surface: "inherited",
            bleed: [3, 4, 6, 10].includes(index) ? "full" : "inset",
            scrolling: [6, 13].includes(index)
              ? "horizontal-region"
              : "document",
            sticky: false,
            density: [1, 11, 12].includes(index) ? "dense" : "open",
          },
        },
        responsive: {
          desktop: d.dna,
          tablet:
            "Reduce gutters and gallery columns without losing ownership of captions or relationships.",
          mobile: d.mobile,
          readingOrder: [
            "section heading",
            "product or campaign reference",
            "authored items and relationships",
            "selected details / option receipt",
            "native destination",
          ],
        },
        accessibility: {
          landmark: "section",
          heading: "h2",
          keyboard: `${d.interaction} Focus stays on native controls; selected states announced; all choices have text names and touch targets.`,
          reducedMotion:
            "Static resting compositions and immediate native sequence movement. No autoplay, wheel interception, hover dependency or new motion capability.",
          contrast:
            "Opaque token surfaces and foreground focus rings; swatch colors supplement names. Client palettes still require contrast verification.",
        },
        actions: getActionCapabilities(id),
      } satisfies SectionContract,
    ];
  }),
) as unknown as Record<CommerceSectionId, SectionContract>;
