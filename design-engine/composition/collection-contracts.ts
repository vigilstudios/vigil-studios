import type { SectionContract } from "./contracts";
const base = {
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
      "Semantic roles inherit. Bounded type scale and measure preserve the original narrative hierarchy.",
  },
  artBehavior:
    "Inherited rhythm, gutters, gaps and rule weight change; image geometry and narrative order remain authored.",
  motionIntensities: ["none"],
  motion: ["none"],
  overrides: ["typography", "artDirection"],
  icons: [],
  media: null,
  compatibility: {
    flow: {
      surface: "inherited",
      bleed: "inset",
      scrolling: "document",
      sticky: false,
    },
  },
  accessibility: {
    landmark: "section",
    heading: "h2",
    keyboard:
      "Native controls with visible focus; static media are not buttons.",
    reducedMotion:
      "Complete static state; no autoplay, smooth scroll or concealed content.",
    contrast:
      "Text sits outside imagery on inherited opaque surfaces; review client token contrast.",
  },
} as const;
export const collectionContracts = {
  "work.viewport-gallery": {
    ...base,
    category: "portfolio",
    usage: "page-capable",
    contentSchema: "viewport-gallery",
    mediaSchema: "viewport-gallery-pieces",
    structuralDNA:
      "M13: A compact category bar meets a gapless two-column image wall. Floating lower-half detail panels reveal on hover, focus or tap; further pieces create document rows.",
    contentConstraints:
      "Gallery title and compact label; 1–24 uniquely identified pieces with title, category and up to 700 characters of detail. Up to four categories; odd final rows stay honest.",
    mediaRequirements:
      "One still per piece with dimensions, alt, responsive sources and explicit contain/cover fit. No invented plates, video, commerce or image overlay navigation safe zone.",
    artDirections: ["precision", "gallery", "publication"],
    artBehavior:
      "Type roles and category-bar rules inherit; the two-column, gapless wall and floating panels remain structural.",
    compatibility: {
      flow: {
        surface: "inherited",
        bleed: "full",
        scrolling: "document",
        sticky: false,
      },
    },
    responsive: {
      desktop:
        "One row fills the viewport below the local category bar. More media adds ordinary document rows; no sticky scroll or forced full-page wrapper.",
      tablet:
        "Two columns retain authored contain/cover and focal points; category bar can wrap and its measured height is reserved.",
      mobile:
        "Two columns remain. Two shorter rows fit below the compact category bar. Tap pins details; long details scroll inside an opaque, focusable panel.",
      readingOrder: [
        "gallery heading",
        "category filters and live count",
        "pieces in authored order",
        "piece detail",
      ],
    },
    accessibility: {
      ...base.accessibility,
      keyboard:
        "Native image buttons expose expanded/control relationships; keyboard focus reveals details. Enter/Space pins or closes, Escape dismisses and returns focus from the panel. A revealed detail panel is focusable for reading and scrolling.",
      contrast:
        "Labels and panels use inherited opaque foreground/background surfaces, independently of image brightness; visible focus uses the same high-contrast surfaces.",
    },
  },
  "work.open-index": {
    ...base,
    category: "portfolio",
    usage: "section-and-page-capable",
    contentSchema: "open-index",
    mediaSchema: "open-index-media",
    structuralDNA:
      "M01: A typographic project directory opens in place into a large image and a working note. The index remains the navigation.",
    contentConstraints:
      "Project title, discipline, short summary and cover per entry.",
    mediaRequirements: "One cover per project; 3\u201312 independent projects.",
    artDirections: ["precision", "publication", "gallery"],
    responsive: {
      desktop:
        "A typographic project directory opens in place into a large image and a working note. The index remains the navigation.",
      tablet:
        "Contracted gutters retain media relationships and control grouping.",
      mobile:
        "Rows retain title and discipline; an opened record becomes image then note. No hover preview or sideways table.",
      readingOrder: [
        "heading",
        "records in authored order",
        "caption",
        "controls",
      ],
    },
  },
  "work.project-chapters": {
    ...base,
    category: "portfolio",
    usage: "page-capable",
    contentSchema: "project-chapters",
    mediaSchema: "project-chapters-media",
    structuralDNA:
      "M02: A numbered project unfolds through large landscape chapter scenes; an inset evidence image and marginal notes interrupt each chapter.",
    contentConstraints: "Ordered chapter title, summary and contextual image.",
    mediaRequirements:
      "3\u20138 authored scenes, optional evidence image with its own caption; explicit contain/cover choice.",
    artDirections: ["publication", "gallery", "runway"],
    responsive: {
      desktop:
        "A numbered project unfolds through large landscape chapter scenes; an inset evidence image and marginal notes interrupt each chapter.",
      tablet:
        "Contracted gutters retain media relationships and control grouping.",
      mobile:
        "Chapter number precedes image. Detail and note share a compact two-column foot, preserving a different pace from vertical cards.",
      readingOrder: [
        "heading",
        "records in authored order",
        "caption",
        "controls",
      ],
    },
  },
  "work.contact-room": {
    ...base,
    category: "portfolio",
    usage: "section-and-page-capable",
    contentSchema: "contact-room",
    mediaSchema: "contact-room-media",
    structuralDNA:
      "M04: An inspectable proof sheet puts numbered small exposures beside one enlarged selection and its notebook caption.",
    contentConstraints:
      "Frame number, image title and short photographer note.",
    mediaRequirements:
      "4\u201324 still photographs. Sheet thumbnails use contain; more than eight frames require dedicated thumbnails.",
    artDirections: ["precision", "publication", "gallery"],
    responsive: {
      desktop:
        "An inspectable proof sheet puts numbered small exposures beside one enlarged selection and its notebook caption.",
      tablet:
        "Contracted gutters retain media relationships and control grouping.",
      mobile:
        "Enlargement comes first, followed by a four-column contact sheet. Tap targets remain 44px or larger.",
      readingOrder: [
        "heading",
        "records in authored order",
        "caption",
        "controls",
      ],
    },
  },
  "work.screening-room": {
    ...base,
    category: "portfolio",
    usage: "section-and-page-capable",
    contentSchema: "screening-room",
    mediaSchema: "screening-room-media",
    structuralDNA:
      "M05: One photograph fills a dark viewing room with a contained image, a generous title outside the photograph, and deliberate previous/next pacing.",
    contentConstraints: "Series title, image title and contextual caption.",
    mediaRequirements:
      "3\u201330 photographs; only the active image is mounted.",
    artDirections: ["gallery", "salon", "publication"],
    responsive: {
      desktop:
        "One photograph fills a dark viewing room with a contained image, a generous title outside the photograph, and deliberate previous/next pacing.",
      tablet:
        "Contracted gutters retain media relationships and control grouping.",
      mobile:
        "A shorter 4:5 viewing stage contains the whole image; controls sit below it. Buttons supplement native touch taps; no swipe-only action.",
      readingOrder: [
        "heading",
        "records in authored order",
        "caption",
        "controls",
      ],
    },
    compatibility: {
      flow: {
        surface: "dark-room",
        bleed: "inset",
        scrolling: "document",
        sticky: false,
      },
    },
    accessibility: {
      ...base.accessibility,
      contrast:
        "Dark viewing room uses fixed neutral high-contrast text outside contained imagery; surrounding site tokens remain inherited.",
    },
  },
  "work.photographic-promenade": {
    ...base,
    category: "portfolio",
    usage: "page-capable",
    contentSchema: "photographic-promenade",
    mediaSchema: "photographic-promenade-media",
    structuralDNA:
      "M06: A horizontal photographic promenade alternates long landscape vistas with narrow portrait pauses, captioned on a continuous baseline.",
    contentConstraints: "Ordered scenes and a short walk note for each.",
    mediaRequirements:
      "3\u201312 images with dimensions; natural ratios determine the width of each scene.",
    artDirections: ["runway", "gallery", "publication"],
    responsive: {
      desktop:
        "A horizontal photographic promenade alternates long landscape vistas with narrow portrait pauses, captioned on a continuous baseline.",
      tablet:
        "Contracted gutters retain media relationships and control grouping.",
      mobile:
        "Native horizontal overflow keeps a visible next-scene edge. Images shrink to 58cqw height, captions stay with their scenes. Touch pan and keyboard buttons coexist.",
      readingOrder: [
        "heading",
        "records in authored order",
        "caption",
        "controls",
      ],
    },
    compatibility: {
      flow: {
        surface: "inherited",
        bleed: "inset",
        scrolling: "horizontal-region",
        sticky: false,
      },
    },
  },
  "work.gallery-hanging": {
    ...base,
    category: "portfolio",
    usage: "section-and-page-capable",
    contentSchema: "gallery-hanging",
    motion:["none","stagger"],motionIntensities:["none","restrained","expressive"],overrides:["typography","artDirection","motion"],
    configuration:[{name:"layout",options:["hanging","paired"]},{name:"ratio",options:["landscape","square","portrait"]},{name:"captions",options:["below","overlay"]},{name:"density",options:["open","compact"]}],
    mediaSchema: "gallery-hanging-media",
    structuralDNA:
      "M07: An asymmetric hanging of whole images uses changing size and offset to create a wall with intentional pauses; paired layout alternates 5/7 and 7/5 emphasis with below-image or opaque overlay labels.",
    contentConstraints: "Work title, medium or context, optional short note.",
    mediaRequirements:
      "4\u201312 still works with reliable dimensions; supports highly inconsistent aspect ratios.",
    artDirections: ["runway", "gallery", "publication"],
    responsive: {
      desktop:
        "An asymmetric hanging of whole images uses changing size and offset to create a wall with intentional pauses; titles sit like gallery labels.",
      tablet:
        "Contracted gutters retain media relationships and control grouping.",
      mobile:
        "A two-track hanging preserves unequal scale and offset, then widens every third image. Reading order remains row-major.",
      readingOrder: [
        "heading",
        "records in authored order",
        "caption",
        "controls",
      ],
    },
  },
  "work.campaign-folio": {
    ...base,
    category: "portfolio",
    usage: "section-and-page-capable",
    contentSchema: "campaign-folio",
    mediaSchema: "campaign-folio-media",
    structuralDNA:
      "M08: A paged editorial spread binds a portrait plate to an opposite image-and-essay page, with a visible spine and running folio.",
    contentConstraints:
      "Campaign heading, spread titles, one editorial sentence per plate.",
    mediaRequirements:
      "2\u20136 authored spreads; principal required, facing plate optional including the final spread.",
    artDirections: ["publication", "runway", "gallery"],
    responsive: {
      desktop:
        "A paged editorial spread binds a portrait plate to an opposite image-and-essay page, with a visible spine and running folio.",
      tablet:
        "Contracted gutters retain media relationships and control grouping.",
      mobile:
        "A spread compresses into a portrait plate with its facing-page inset and note beneath; explicit spread controls remain together.",
      readingOrder: [
        "heading",
        "records in authored order",
        "caption",
        "controls",
      ],
    },
  },
  "work.look-closer": {
    ...base,
    category: "portfolio",
    usage: "section-oriented",
    contentSchema: "look-closer",
    mediaSchema: "look-closer-media",
    structuralDNA:
      "M09: A dominant full-look image sits beside a smaller uncropped companion plate and a large numbered selector. Each selection is an authored image pair.",
    contentConstraints: "Look title, overview note and companion note.",
    mediaRequirements:
      "2\u20136 explicitly authored overview/companion pairs with a relationship; never positional inference.",
    artDirections: ["precision", "publication", "runway"],
    responsive: {
      desktop:
        "A dominant full-look image sits beside a smaller uncropped companion plate and a large numbered selector. Each selection is an authored image pair.",
      tablet:
        "Contracted gutters retain media relationships and control grouping.",
      mobile:
        "Overview and companion stay side by side at unequal widths; prose drops below. Pair selector is a wrapping button row.",
      readingOrder: [
        "heading",
        "records in authored order",
        "caption",
        "controls",
      ],
    },
  },
  "work.campaign-score": {
    ...base,
    category: "portfolio",
    usage: "page-capable",
    contentSchema: "campaign-score",
    mediaSchema: "campaign-score-media",
    structuralDNA:
      "M10: Overscale chapter words alternate with edge-to-edge photographic bands and small counter-images, building a campaign as a graphic score.",
    contentConstraints:
      "Three to six short chapter phrases and a narrative line per image.",
    mediaRequirements:
      "3\u20136 campaign photographs with safe central crop and full-image companion.",
    artDirections: ["billboard", "publication", "runway"],
    responsive: {
      desktop:
        "Overscale chapter words alternate with edge-to-edge photographic bands and small counter-images, building a campaign as a graphic score.",
      tablet:
        "Contracted gutters retain media relationships and control grouping.",
      mobile:
        "Type becomes two-line phrases above a taller image band; a small full-image plate preserves what the dramatic crop omits.",
      readingOrder: [
        "heading",
        "records in authored order",
        "caption",
        "controls",
      ],
    },
    compatibility: {
      flow: {
        surface: "inherited",
        bleed: "full",
        scrolling: "document",
        sticky: false,
      },
    },
  },
  "work.media-cabinet": {
    ...base,
    category: "portfolio",
    usage: "section-and-page-capable",
    contentSchema: "media-cabinet",
    mediaSchema: "media-cabinet-media",
    structuralDNA:
      "M11: A working archive sorts mixed stills and motion records by subject, with large record numbers, format labels, notes and independent native playback.",
    contentConstraints:
      "Record title, category, format, note; transcript for video.",
    mediaRequirements:
      "4\u201324 discriminated image/video records; video needs dimensions, poster, transcript and captions when speech exists. Still delivery uses authored responsive image sources.",
    artDirections: ["precision", "publication", "gallery"],
    responsive: {
      desktop:
        "A working archive sorts mixed stills and motion records by subject, with large record numbers, format labels, notes and independent native playback.",
      tablet:
        "Contracted gutters retain media relationships and control grouping.",
      mobile:
        "Compact two-column records become full-width for video. Notes stay below each record and filters wrap.",
      readingOrder: [
        "heading",
        "records in authored order",
        "caption",
        "controls",
      ],
    },
  },
  "work.light-table": {
    ...base,
    category: "portfolio",
    usage: "section-and-page-capable",
    contentSchema: "light-table",
    mediaSchema: "light-table-media",
    structuralDNA:
      "M12: Two independent viewing wells let a visitor pin unlike images side by side from a shared tray, supporting visual comparison without a matched-image wipe.",
    contentConstraints:
      "Independent media titles and comparison notes; no implied before/after claim.",
    mediaRequirements:
      "3\u201316 still images, including uneven resolutions. More than eight tray images require dedicated thumbnails. No registration or identical-camera constraint.",
    artDirections: ["salon", "precision", "gallery"],
    responsive: {
      desktop:
        "Two independent viewing wells let a visitor pin unlike images side by side from a shared tray, supporting visual comparison without a matched-image wipe.",
      tablet:
        "Contracted gutters retain media relationships and control grouping.",
      mobile:
        "Two wells remain adjacent with captions below; tray becomes horizontally scrollable. Tap a well, then a source; no drag requirement.",
      readingOrder: [
        "heading",
        "records in authored order",
        "caption",
        "controls",
      ],
    },
  },
  "story.manifesto-fold": {
    ...base,
    category: "storytelling",
    usage: "section-oriented",
    contentSchema: "manifesto-fold",
    mediaSchema: null,
    structuralDNA:
      "S02: Numbered manifesto folds retain a statement bound to its explanation.",
    contentConstraints:
      "3–6 principles; statement 120 characters, explanation 700.",
    mediaRequirements: "No media requirement.",
    artDirections: ["publication", "billboard", "runway"],
    responsive: {
      desktop:
        "Numbered manifesto folds retain a statement bound to its explanation.",
      tablet: "Contract rhythm while preserving narrative measures.",
      mobile: "Number, statement, explanation with deliberate fold rules.",
      readingOrder: ["heading", "narrative", "continuation"],
    },
  },
  "story.open-letter": {
    ...base,
    category: "storytelling",
    usage: "section-oriented",
    contentSchema: "open-letter",
    mediaSchema: null,
    structuralDNA:
      "S07: An open letter preserves salutation, paragraphs, signature and optional postscript.",
    contentConstraints:
      "2–5 paragraphs up to 1200 characters; optional 500-character postscript.",
    mediaRequirements: "No media requirement.",
    artDirections: ["salon", "publication", "gallery"],
    responsive: {
      desktop:
        "An open letter preserves salutation, paragraphs, signature and optional postscript.",
      tablet: "Contract rhythm while preserving narrative measures.",
      mobile:
        "Letter measure narrows; indented paragraph and separate postscript remain.",
      readingOrder: ["heading", "narrative", "continuation"],
    },
  },
  "story.material-relay": {
    ...base,
    category: "storytelling",
    usage: "section-oriented",
    contentSchema: "material-relay",
    mediaSchema: "relay-stage-images",
    structuralDNA:
      "S08: Three independent material stages bind Find / Work / Pass responsibility to authored imagery.",
    contentConstraints:
      "Exactly three authored stage images and responsibilities; verbs up to 30 characters.",
    mediaRequirements:
      "Three independently supplied images with dimensions, alt and focal points.",
    artDirections: ["runway", "publication", "gallery"],
    responsive: {
      desktop:
        "Three independent material stages bind Find / Work / Pass responsibility to authored imagery.",
      tablet: "Contract rhythm while preserving narrative measures.",
      mobile: "Two stages share unequal lanes; final stage spans the relay.",
      readingOrder: ["heading", "narrative", "continuation"],
    },
  },
} as const satisfies Record<string, SectionContract>;
