import type {
  Product,
  ProductMedia,
  CommerceModel,
  CommerceStudyId,
} from "./contracts";
import { commerceStudySchemas } from "./contracts";
export const commerceContexts = [
  {
    id: "streetwear",
    brand: "AFTER HOURS",
    context: "Independent streetwear",
    palette: ["#edece7", "#202220", "#4a5044"],
    collection: "Off-duty / 07",
    premise: "Clothes for the hours that belong to you.",
    note: "Volume, utility and a little room to move. An edit of everyday layers, chosen for how they work together.",
    roles: ["The outer layer", "The foundation", "The movement layer"],
  },
  {
    id: "beauty",
    brand: "morrow",
    context: "Small-batch skincare",
    palette: ["#f5e6d9", "#432c28", "#844329"],
    collection: "The daily ritual",
    premise: "Make a little room for yourself.",
    note: "A thoughtful shelf of everyday essentials. Begin with the texture you enjoy and build a ritual that fits your day.",
    roles: ["The first step", "The finishing layer", "The clean beginning"],
  },
  {
    id: "audio",
    brand: "FORM / FREQUENCY",
    context: "Personal audio & digital editions",
    palette: ["#192429", "#edf0e9", "#f3bd66"],
    collection: "Listening instruments",
    premise: "Less interference. More listening.",
    note: "Objects with a clear purpose. Compare the physical details, choose how you listen, and make space for the music.",
    roles: ["Private listening", "Room listening", "The source"],
  },
] as const;
export type CommerceContext = (typeof commerceContexts)[number];
const asset = (
  name: string,
  label: string,
  width = 1200,
  height = 900,
): ProductMedia => ({
  kind: "image",
  id: name,
  label,
  image: {
    src: `/design-engine-study-007/${name}.webp`,
    alt: `${label}. AI-generated illustrative product study.`,
    width,
    height,
  },
});
const fashion = [
  asset(
    "fashion-look",
    "Charcoal hoodie and cargo trousers shown together on a model",
    1024,
    1536,
  ),
  asset(
    "fashion-campaign",
    "Oversized tees and cargos at an urban court",
    1536,
    1024,
  ),
  asset(
    "fashion-training",
    "Olive training layers shown on a model",
    1024,
    1536,
  ),
  asset("fashion-gym", "Training apparel in an industrial gym", 1536, 1024),
];
const beauty = [
  asset(
    "beauty-serum",
    "Amber glass serum bottle with a terracotta cap",
    1122,
    1402,
  ),
  asset("beauty-cream", "Open terracotta cream jar with ivory cream"),
  asset(
    "beauty-wash",
    "Ivory cleansing bottle with a terracotta pump",
    1122,
    1402,
  ),
];
const audio = [
  asset("audio-headphones", "Graphite over-ear headphones with an amber cable"),
  asset(
    "audio-speaker",
    "Desktop speaker with perforated grille and amber dial",
  ),
  asset("audio-player", "Pocket music player with tactile silver dial"),
];
export const contextMedia = [fashion, beauty, audio];
const details = [
  [
    asset("fashion-detail", "Pocket seam and charcoal fabric detail"),
    asset("fashion-construction", "Hood and shoulder construction detail"),
  ],
  [
    asset("beauty-detail", "Terracotta closure and amber glass neck detail"),
    asset(
      "beauty-construction",
      "Paper label texture and curved glass base detail",
    ),
  ],
  [
    asset("audio-detail", "Brushed metal earcup and soft cushion detail"),
    asset("audio-construction", "Woven headband, hinge and cable detail"),
  ],
];
// Price, ingredients, provenance, options and performance copy are fictional presentation fixtures.
const seeds = [
  [
    [
      "Volume hoodie",
      "Layers",
      14800,
      "A generous charcoal layer with a structured hood and an unhurried fit.",
    ],
    [
      "Court tee",
      "Essentials",
      5800,
      "An oversized tee with dropped shoulders and a weighty hand.",
    ],
    [
      "Transit cargo",
      "Movement",
      12400,
      "Charcoal utility trousers with space for daily essentials. Pictured with the volume hoodie.",
    ],
    [
      "Training layer",
      "Movement",
      9800,
      "A light outer layer for warming up and winding down.",
    ],
    [
      "Volume hoodie / studio",
      "Layers",
      16800,
      "An alternate edition of the charcoal volume silhouette.",
    ],
    [
      "Court tee / edition",
      "Essentials",
      6400,
      "A limited graphic-free edition of the everyday court tee.",
    ],
  ],
  [
    [
      "Day serum",
      "Treat",
      4800,
      "A light-textured daily serum in an amber glass bottle.",
    ],
    [
      "Quiet cream",
      "Moisturize",
      5600,
      "A soft cream texture presented in a reusable ceramic study vessel.",
    ],
    [
      "Soft wash",
      "Cleanse",
      3200,
      "A simple cleansing step in an ivory pump bottle.",
    ],
    [
      "Day serum / travel",
      "Treat",
      2400,
      "A smaller format for a familiar daily ritual. Full-size vessel pictured.",
    ],
    [
      "Quiet cream / refill",
      "Moisturize",
      4200,
      "A refill format concept; the complete jar is pictured for context.",
    ],
  ],
  [
    [
      "H01 / Headphones",
      "Headphones",
      32900,
      "Over-ear listening with a tactile metal shell and a woven headband.",
    ],
    [
      "S01 / Desk speaker",
      "Speakers",
      24900,
      "A compact room speaker with a physical volume control.",
    ],
    [
      "P01 / Pocket player",
      "Players",
      19900,
      "A pocket-sized player with a visible, tactile control hierarchy.",
    ],
    [
      "H01 / Studio edition",
      "Headphones",
      37900,
      "An alternate tuning concept in the H01 chassis. Base enclosure pictured.",
    ],
    [
      "S01 / Paired edition",
      "Speakers",
      44900,
      "A two-speaker configuration concept. One speaker pictured.",
    ],
    [
      "Listening journal",
      "Digital editions",
      600,
      "A monthly downloadable listening journal. Digital product; no physical object.",
    ],
  ],
] as const;
export function contextProducts(adaptation: number): Product[] {
  const c = commerceContexts[adaptation],
    media = contextMedia[adaptation];
  return seeds[adaptation].map(
    ([title, category, amountMinor, description], i) => ({
      productId: `${c.id}-${i + 1}`,
      slug: `${c.id}-object-${i + 1}`,
      title,
      category,
      description,
      collection: c.collection,
      price: {
        amountMinor,
        currency: adaptation === 1 ? "GBP" : "USD",
        mode:
          adaptation === 2 && i === 5
            ? "subscription"
            : i === 4
              ? "starting"
              : "fixed",
        ...(adaptation === 2 && i === 5 ? { interval: "month" as const } : {}),
      },
      ...(i === 1
        ? {
            compareAtPrice: {
              amountMinor: amountMinor + 2000,
              currency: adaptation === 1 ? ("GBP" as const) : ("USD" as const),
              mode: "fixed" as const,
            },
          }
        : {}),
      media:
        adaptation === 2 && i === 5
          ? []
          : [adaptation === 0 && i === 2 ? media[0] : media[i % media.length]],
      badges: i === 0 ? ["New edition"] : i === 1 ? ["Archive price"] : [],
      availability:
        i === 3 ? "unavailable" : i === 4 ? "preorder" : "available",
      destination: {
        label: `Explore ${title}`,
        href: `#${c.id}-object-${i + 1}`,
      },
    }),
  );
}
export type StressMode = "authored" | "long-copy" | "no-media";
export function makeCommerceModel(
  id: CommerceStudyId,
  adaptation: number,
  stress: StressMode = "authored",
): CommerceModel {
  const c = commerceContexts[adaptation],
    p = contextProducts(adaptation),
    media = contextMedia[adaptation];
  const base = { brand: c.brand, title: c.premise, introduction: c.note };
  const plates = media.map((m, i) => ({
    id: `plate-${i}`,
    media: m,
    caption:
      adaptation === 0
        ? [
            "Silhouette study / charcoal layers",
            "Campaign context / the court",
            "Movement study / olive layers",
            "Campaign context / the gym",
          ][i]
        : `${m.label}. Illustrative assortment reference; not an alternate angle of the selected product.`,
  }));
  let content: unknown;
  switch (id) {
    case "P01":
      content = {
        ...base,
        title:
          adaptation === 0
            ? "The off-duty edit."
            : adaptation === 1
              ? "A shelf, considered."
              : "Objects worth listening to.",
        editorialNote: [
          "Start with volume. Add a quieter layer. Leave enough room to make it yours.",
          "A light first step, a soft finish. An edit built around the small pleasure of a daily ritual.",
          "From a private moment to a room full of sound. Three instruments, each with its own purpose.",
        ][adaptation],
        items: p
          .slice(0, adaptation === 2 ? 5 : 3)
          .map((product, i) => ({
            product,
            note: [
              "Begin here. The piece that sets the tone.",
              "A different texture. A useful counterpoint.",
              "Keep it close. Made for the everyday.",
              "Another expression of the same idea.",
              "For a little more room to explore.",
            ][i],
          })),
      };
      break;
    case "P02":
      content = {
        ...base,
        title: "The product register",
        products: p,
        totalCatalogLabel: `Illustrative ${p.length}-record slice · future host owns the full catalog`,
      };
      break;
    case "P03":
      content = {
        ...base,
        title: p[0].title,
        product: p[0],
        edition:
          adaptation === 0
            ? "OFF-DUTY / EDITION 07"
            : adaptation === 1
              ? "MORNING / OBJECT 01"
              : "INSTRUMENT / H01",
        specifications: [
          {
            id: "form",
            label: "Form",
            value: [
              "Relaxed silhouette",
              "Light serum texture",
              "Over-ear construction",
            ][adaptation],
          },
          {
            id: "material",
            label: "Material",
            value: [
              "Cotton fleece study",
              "Amber glass vessel",
              "Anodized metal shell",
            ][adaptation],
          },
          {
            id: "detail",
            label: "Detail",
            value: ["Structured hood", "Ceramic-finish cap", "Woven headband"][
              adaptation
            ],
          },
        ],
      };
      break;
    case "P04":
      content = {
        ...base,
        title: "A new frequency.",
        statement: [
          "AFTER THE HOURS",
          "A SLOWER MORNING",
          "TURN THE WORLD DOWN",
        ][adaptation],
        product: p[0],
        campaignMedia: media[adaptation === 0 ? 1 : 0],
        release: "Edition 07 · release-date presentation study",
      };
      break;
    case "P05":
      content = {
        ...base,
        title: [
          "Find your uniform.",
          "A rhythm of your own.",
          "Ways of listening.",
        ][adaptation],
        collections: media
          .slice(0, 3)
          .map((m, i) => ({
            id: `collection-${i}`,
            title: [p[i].category, c.roles[i], p[i].category][i],
            description: p[i].description,
            media: m,
            productCount: [12, 8, 6][i],
            destination: {
              label: `Explore ${p[i].category}`,
              href: `#collection-${c.id}-${i}`,
            },
          })),
      };
      break;
    case "P06":
      content = {
        ...base,
        title: [
          "One look. Your own way.",
          "The ritual, in parts.",
          "Build a listening space.",
        ][adaptation],
        looks: [
          {
            id: "first",
            title: ["Off-duty / 01", "Morning ritual", "Listening desk"][
              adaptation
            ],
            campaignMedia: media[adaptation === 0 ? 0 : 0],
            caption: [
              "The charcoal silhouette. Product legend is an editorial mapping; the campaign does not replace individual packshots.",
              "A serum-led ritual. Companion products are suggested pairings and are not all pictured.",
              "Start with private listening. The speaker and player are editorial companions, not objects in this photograph.",
            ][adaptation],
            products: p.slice(0, 3),
            roles: [...c.roles],
          },
          {
            id: "second",
            title: ["Movement / 02", "Evening ritual", "Room listening"][
              adaptation
            ],
            campaignMedia: media[adaptation === 0 ? 2 : 1],
            caption:
              "A second authored arrangement. Related product records remain separate from the campaign image.",
            products: [p[2], p[1]],
            roles: [c.roles[2], c.roles[1]],
          },
        ],
      };
      break;
    case "P07":
      content = {
        ...base,
        title: [
          "A day without a script.",
          "Notes on the everyday.",
          "Three ways to tune in.",
        ][adaptation],
        spreads: plates
          .slice(0, 3)
          .map((plate, i) => ({
            id: `spread-${i}`,
            title: ["First light", "In the middle", "After hours"][i],
            story: [c.note, p[1].description, p[2].description][i],
            campaignMedia: plate.media,
            product: p[i],
          })),
      };
      break;
    case "P08":
      content = {
        ...base,
        title: "Closer to the object.",
        product: p[0],
        materials: ["Surface", "Construction", "Everyday care"].map(
          (name, i) => ({
            id: `material-${i}`,
            name,
            detail:
              adaptation === 0
                ? [
                    "A dense fleece hand gives the volume its shape.",
                    "The hood and shoulder create a clear silhouette.",
                    "Review the actual garment care label before washing.",
                  ][i]
                : adaptation === 1
                  ? [
                      "Amber glass and a softly textured closure establish the vessel’s tactile character.",
                      "The dropper format offers a deliberate single-step gesture.",
                      "Formula, ingredients and handling instructions require the brand’s verified product data.",
                    ][i]
                  : [
                      "The shell balances a brushed surface with a soft contact material.",
                      "The headband and earcup connection define how the object moves.",
                      "Serviceability and replacement parts require verified manufacturer information.",
                    ][i],
            media: i === 2 ? media[0] : details[adaptation][i],
            evidence:
              "Generated detail study of the reference object. Material descriptions are illustrative; production needs verified product facts and photography.",
          }),
        ),
      };
      break;
    case "P09":
      content = {
        ...base,
        title: "An object has a beginning.",
        product: p[0],
        stages: ["The starting material", "The making", "The life after"].map(
          (title, i) => ({
            id: `stage-${i}`,
            title,
            place: [
              "Material selection",
              "Assembly / formulation",
              "Care and use",
            ][i],
            story:
              adaptation === 0
                ? [
                    "Choose the cloth for weight, drape and durability before deciding its silhouette.",
                    "Pattern and seam decisions turn cloth into a useful daily layer.",
                    "A clear care label and repair information belong beside the garment.",
                  ][i]
                : adaptation === 1
                  ? [
                      "Choose packaging materials with a clear handling and reuse story.",
                      "The formula’s source and batch history belong to the maker’s verified records.",
                      "Explain storage, use and disposal with the actual product instructions.",
                    ][i]
                  : [
                      "Select the enclosure and contact surfaces around the listening experience.",
                      "Record assembly and quality checks without claiming unverified performance.",
                      "Document repair access and replacement parts before promising longevity.",
                    ][i],
            evidence:
              "Fictional process narrative. No supplier verification or certification asserted.",
            ...(i === 1 ? { media: media[0] } : {}),
          }),
        ),
      };
      break;
    case "P10": {
      const primary = media[0];
      const gallery = [
        {
          id: "view-main",
          media: primary,
          caption: "Primary product / complete view.",
        },
        {
          id: "view-detail",
          media: details[adaptation][0],
          caption: "Surface detail / generated from the same reference object.",
        },
        {
          id: "view-360",
          media: {
            kind: "interactive-placeholder",
            id: "rotation-study",
            label: "360° inspection concept",
            image: primary.kind === "image" ? primary.image : undefined,
            explanation:
              "Interactive rotation is a future capability. This still provides a complete accessible fallback.",
          },
          caption: "Static fallback. No 3D or 360° viewer has been built.",
        },
      ];
      if (adaptation === 0)
        gallery.push({
          id: "view-film",
          media: {
            kind: "video",
            id: "campaign-film",
            label: "Silent apparel campaign sequence",
            video: {
              src: "/design-engine-study-005/concrete-faceless.mp4",
              width: 960,
              height: 540,
              label: "Silent apparel campaign sequence",
              poster: primary.kind === "image" ? primary.image : undefined,
              hasSpeech: false,
              transcript:
                "A silent six-second still sequence: charcoal street look, urban streetwear, olive training look. This is illustrative generated apparel imagery, not documentary footage.",
            },
          },
          caption: "User-started silent still sequence from Collection 005.",
        } as (typeof gallery)[number]);
      content = {
        ...base,
        title: "Every view has a purpose.",
        product: p[0],
        gallery,
      };
      break;
    }
    case "P11":
      content = {
        ...base,
        title: "An object, in context.",
        product: p[0],
        plates: [
          {
            id: "whole",
            media: media[0],
            caption:
              "The complete object. Apparel is shown on a model; accompanying garments are contextual.",
          },
          ...details[adaptation].map((m, i) => ({
            id: `detail-${i}`,
            media: m,
            caption:
              "Generated close-up of the reference object, not measured manufacturing evidence.",
          })),
        ],
      };
      break;
    case "P12": {
      const values =
        adaptation === 0
          ? ["S", "M", "L"]
          : adaptation === 1
            ? ["30 ml", "60 ml", "90 ml"]
            : ["Standard", "Studio", "Reference"];
      const finishes =
        adaptation === 0
          ? ["Charcoal", "Olive"]
          : adaptation === 1
            ? ["Original", "Unfragranced"]
            : ["Graphite", "Silver"];
      content = {
        ...base,
        title: "Make it your own.",
        product: p[0],
        guidance:
          "Choose each option to inspect the supplied variant record. No purchase or live stock check occurs in this study.",
        options: [
          {
            id: "size",
            name: ["Size", "Volume", "Configuration"][adaptation],
            presentation: adaptation === 0 ? "size" : "configuration",
            values: values.map((label, i) => ({ id: `size-${i}`, label })),
          },
          {
            id: "finish",
            name: ["Color", "Formula", "Finish"][adaptation],
            presentation: adaptation === 1 ? "configuration" : "swatch",
            values: finishes.map((label, i) => ({
              id: `finish-${i}`,
              label,
              ...(adaptation !== 1 ? { color: i ? "#999a85" : "#343936" } : {}),
            })),
          },
        ],
        variants: values.flatMap((_, i) =>
          finishes.flatMap((__, j) =>
            i === 2 && j === 1
              ? []
              : [
                  {
                    id: `variant-${i}-${j}`,
                    optionValues: { size: `size-${i}`, finish: `finish-${j}` },
                    price: {
                      ...p[0].price,
                      amountMinor: p[0].price.amountMinor + i * 1000,
                    },
                    availability:
                      i === 1 && j === 1 ? "unavailable" : "available",
                  },
                ],
          ),
        ),
      };
      break;
    }
    case "P13":
      content = {
        ...base,
        title: "Find the right fit.",
        products: p.slice(0, 3),
        criteria: [
          {
            id: "purpose",
            label: "Made for",
            values:
              adaptation === 0
                ? ["Layering", "Everyday foundation", "Moving through the city"]
                : adaptation === 1
                  ? [
                      "A light serum step",
                      "A cream finishing step",
                      "A cleansing step",
                    ]
                  : [
                      "Private listening",
                      "A small room",
                      "Listening on the move",
                    ],
          },
          {
            id: "form",
            label: "Form / feel",
            values:
              adaptation === 0
                ? ["Relaxed fleece", "Oversized jersey", "Utility weave"]
                : adaptation === 1
                  ? ["Light serum", "Soft cream", "Liquid wash"]
                  : ["Over-ear", "Desktop enclosure", "Pocket-sized"],
          },
          {
            id: "detail",
            label: "Consider",
            values:
              adaptation === 0
                ? [
                    "Layering room",
                    "Length and shoulder fit",
                    "Waist and pocket placement",
                  ]
                : adaptation === 1
                  ? [
                      "Brand ingredient list",
                      "Brand handling instructions",
                      "Brand usage instructions",
                    ]
                  : ["Contact comfort", "Desk space", "Library compatibility"],
          },
          {
            id: "evidence",
            label: "Evidence",
            values: [
              "Illustrative fixture",
              "Illustrative fixture",
              "Illustrative fixture",
            ],
          },
        ],
      };
      break;
    case "P14":
      content = {
        ...base,
        title: [
          "Good in company.",
          "The next small step.",
          "Keep the signal going.",
        ][adaptation],
        anchor: p[0],
        relatedProducts: p
          .slice(1, adaptation === 2 ? 6 : 4)
          .map((product, i) => ({
            product,
            relationship: [
              "A useful counterpoint",
              "For the next part of the day",
              "Another way to use it",
              "An alternate edition",
              "Take a note",
            ][i],
            reason: product.description,
          })),
      };
      break;
  }
  if (stress === "long-copy")
    content = JSON.parse(JSON.stringify(content), (key, value) =>
      key === "title" && typeof value === "string"
        ? `${value} — an intentionally extended product edition for everyday use`.slice(
            0,
            78,
          )
        : value,
    );
  // A single typed parser per mechanism makes fixture problems fail before visual review.
  return {
    kind: id,
    content: commerceStudySchemas[id].parse(content),
  } as CommerceModel;
}
