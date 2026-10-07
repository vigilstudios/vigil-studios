import type { NavigationArchitecture } from "./types";
const left = ["left"] as const,
  right = ["right"] as const,
  center = ["center"] as const;
const tonal = ["brand", "light-on-dark", "dark-on-light"] as const;
const types = ["editorial", "poster", "technical"] as const;
const arts = ["publication", "billboard", "precision"] as const;
const base = {
  backgrounds: ["solid"] as const,
  contrasts: tonal,
  densities: ["comfortable", "compact"] as const,
  typography: types,
  art: arts,
};
const authoredStudies: readonly NavigationArchitecture[] = [
  {
    ...base,
    id: "NX01",
    name: "Datum",
    scale: "small",
    destinations: [3, 5],
    nested: true,
    dna: "A wordmark signs the left margin; a single baseline of destinations has its own alignment. One-level disclosures keep a small site legible.",
    supportedAlignments: {
      brand: left,
      primary: ["left", "center", "right"],
      actions: right,
    },
    positions: ["flow"],
    utilities: ["cta"],
    scroll: ["static", "sticky", "reveal"],
    desktop: "One calm baseline with a distinct action at the end.",
    mobile:
      "Anchored index beneath the brand; child groups expand inside the overlay without moving the page.",
    expansion:
      "Anchored per-destination disclosures; compact mobile overlay index.",
    constraints:
      "3–5 destinations; one child level. Long words wrap; do not add utility rows.",
    motion:
      "Short opacity reveal; hide/reveal returns immediately on keyboard focus or upward scroll.",
    shortlist:
      "An intentionally quiet, alignment-aware baseline for small sites.",
  },
  {
    ...base,
    id: "NX02",
    name: "Meridian",
    scale: "standard",
    destinations: [4, 8],
    nested: true,
    dna: "The brand is the hinge between two equal navigation wings. Actions live on a separate small service line.",
    supportedAlignments: {
      brand: center,
      primary: ["split"],
      actions: ["left", "right"],
    },
    positions: ["flow"],
    utilities: ["cta", "locale"],
    scroll: ["static", "sticky"],
    desktop:
      "Two balanced link groups orbit a centered wordmark; the logo never moves off the axis.",
    mobile:
      "Centered brand above two visible priority destinations and a bottom sheet for the full hierarchy.",
    expansion: "Per-link desktop disclosures; mobile two-column sheet.",
    constraints:
      "Even split is preferred; broad image marks cap at 14rem. CTA never competes with the center.",
    motion:
      "Sheet enters with a small vertical offset; reduced motion removes it.",
    typography: ["luxury", "fashion", "geometric"],
    shortlist:
      "Centered-brand and luxury/retail coverage absent from production.",
  },
  {
    ...base,
    id: "NX03",
    name: "Dispatch",
    scale: "standard",
    destinations: [5, 8],
    nested: true,
    dna: "A publication masthead separates identity, edition context and a ruled destination register. Reading hierarchy takes precedence over header economy.",
    supportedAlignments: {
      brand: ["left", "center"],
      primary: ["left", "center"],
      actions: right,
    },
    positions: ["flow"],
    utilities: ["cta", "search", "utility-links"],
    scroll: ["static", "compact"],
    desktop: "Large wordmark and colophon above a full-width section rail.",
    mobile:
      "Small masthead, two priority sections and a numbered editorial index sheet with expandable departments.",
    expansion: "Section disclosures and a numbered mobile index.",
    constraints:
      "Flow or overlay; compact state reduces brand scale but keeps every destination reachable. Avoid another full masthead immediately below.",
    motion: "Brand scale compacts on scroll; no movement under reduced motion.",
    typography: ["editorial", "brutalist", "humanist"],
    shortlist:
      "A true content/publication header, not an enlarged horizontal bar.",
  },
  {
    ...base,
    id: "NX04",
    name: "Pocket Dock",
    scale: "small",
    destinations: [3, 5],
    nested: false,
    dna: "A small signed launchpad holds only the current context and menu control; opening creates an adjacent destination fan with equal touch targets.",
    supportedAlignments: { brand: left, primary: left, actions: right },
    positions: ["floating"],
    utilities: ["cta"],
    scroll: ["static", "sticky"],
    desktop:
      "Detached dock with optional priority routes; the full index opens in an attached overlay.",
    mobile:
      "Reachable compact launcher with an attached vertical sheet; no fixed bottom bar obstructing browser chrome.",
    expansion: "Nonmodal fan of individually numbered destinations.",
    constraints:
      "No nesting. True zero-footprint floating across every Hero. Choose dock position, width, visible links and text contrast to suit the opening.",
    motion:
      "Fan opens with existing restrained opacity/offset vocabulary; no radial flight.",
    typography: ["geometric", "playful", "neo-grotesk"],
  },
  {
    ...base,
    id: "NX05",
    name: "Viewfinder",
    scale: "small",
    destinations: [3, 5],
    nested: false,
    dna: "Identity and a framed menu trigger occupy opposite corners of a media-safe band. The revealed menu leaves a deliberate window onto the Hero.",
    supportedAlignments: { brand: left, primary: right, actions: right },
    positions: ["overlay", "flow"],
    backgrounds: ["solid"],
    contrasts: ["light-on-dark"],
    utilities: ["cta"],
    scroll: ["solidify", "static"],
    densities: ["comfortable"],
    desktop:
      "Corner wordmark, scene caption and discreet frame trigger; opaque panel occupies only the right half when opened.",
    mobile:
      "Full-height scene index with large destinations and a persistent close control.",
    expansion:
      "Cinematic side sheet on a solid surface; author header text contrast for the selected Hero.",
    constraints:
      "Hero-centric mode has no background until the measured Hero leaves view. Author light/dark text contrast for the image; panels always retain a solid surface.",
    motion:
      "Transparent header becomes solid at the measured Hero boundary; restrained panel fade, no image parallax.",
    typography: ["fashion", "poster", "luxury"],
    art: ["runway", "billboard", "gallery"],
    shortlist: "Media-led sites gain a contrast-safe cinematic family.",
  },
  {
    ...base,
    id: "NX06",
    name: "Switchboard",
    scale: "complex",
    destinations: [5, 8],
    nested: true,
    dna: "A compact utility band carries task controls while a separate high-contrast destination band carries the site map. Identity belongs to the utility band.",
    supportedAlignments: {
      brand: left,
      primary: ["left", "center"],
      actions: right,
    },
    positions: ["flow"],
    utilities: ["cta", "search", "account", "cart", "locale"],
    scroll: ["static", "sticky"],
    densities: ["compact"],
    desktop:
      "Utility/identity row above a dense, clearly named department row.",
    mobile:
      "Search remains a direct control; departments open as accordions inside the overlay with utility actions after them.",
    expansion:
      "Hierarchical destination disclosures with persistent utility access.",
    constraints:
      "Maximum two levels; commerce/account/locale are labelled presentation previews. No account or basket state.",
    motion: "Immediate task access; only disclosure opacity animates.",
    typography: ["humanist", "neo-grotesk", "technical"],
    shortlist:
      "Task-heavy and commerce headers need their own utility hierarchy.",
  },
  {
    ...base,
    id: "NX07",
    name: "Atlas Hall",
    scale: "complex",
    destinations: [5, 8],
    nested: true,
    dna: "A directory gate opens a full-width hall of grouped destinations beside an authored orientation note. The taxonomy, not promotional cards, determines columns.",
    supportedAlignments: { brand: left, primary: left, actions: right },
    positions: ["flow"],
    utilities: ["cta", "search", "utility-links"],
    scroll: ["static", "sticky"],
    desktop:
      "Brand, two priority routes and an explicit directory control; grouped mega panel reveals the full architecture.",
    mobile:
      "Single-column directory with independently expandable groups and visible parent destinations.",
    expansion: "Wide grouped overlay disclosure; no hover-only access.",
    constraints:
      "5–8 groups with at most 6 children each. Mega panel overlays the page in its own stacking layer; the menu scrolls internally when needed.",
    motion:
      "Short panel reveal; group hierarchy remains readable with motion disabled.",
    typography: ["geometric", "brutalist", "technical"],
    shortlist:
      "Broad grouped IA fills the largest functional gap in the library.",
  },
  {
    ...base,
    id: "NX08",
    name: "Folio Takeover",
    scale: "standard",
    destinations: [5, 8],
    nested: true,
    dna: "A sparse colophon opens a full-screen typographic index. Oversized parent destinations and a quieter companion column create a deliberate reading sequence.",
    supportedAlignments: {
      brand: ["left", "right"],
      primary: left,
      actions: right,
    },
    positions: ["flow"],
    utilities: ["cta", "utility-links"],
    scroll: ["static"],
    densities: ["comfortable"],
    desktop:
      "Small signature and labelled Index control; open state dedicates the viewport to navigation.",
    mobile:
      "Editorial full-screen index, expandable child routes and a close control kept at the top of its scroll surface.",
    expansion:
      "Native modal dialog; parent/child hierarchy, inert background and focus restoration.",
    constraints:
      "No mega-menu density; eight parent destinations maximum. Longer indexes scroll inside the modal.",
    motion:
      "Existing restrained opacity entry. Future stagger must never delay keyboard access.",
    typography: ["editorial", "poster", "humanist"],
  },
  {
    ...base,
    id: "NX09",
    name: "Margin Rail",
    scale: "small",
    destinations: [3, 5],
    nested: false,
    dna: "A narrow vertical rail owns a separate page margin. A symbol leads a numbered vertical route register while the Hero occupies the remaining field.",
    supportedAlignments: { brand: left, primary: left, actions: left },
    positions: ["edge"],
    utilities: ["cta"],
    scroll: ["static", "sticky"],
    densities: ["comfortable"],
    desktop:
      "Left rail with symbol/wordmark, vertical index and bottom action; Hero gets an explicit reserved column.",
    mobile:
      "Rail becomes a top strip plus a labelled full-height side drawer; no sideways labels or hidden edge gestures.",
    expansion:
      "Modal side drawer on narrow artboards; desktop destinations remain visible.",
    constraints:
      "Requires a composition wrapper reserving 13rem. Incompatible with full-bleed page chrome or independently sticky left rails.",
    motion: "Drawer opacity/translation only; never horizontal scroll capture.",
    typography: ["geometric", "brutalist", "technical"],
    shortlist:
      "Adds a genuinely different spatial model without a bespoke Hero.",
  },
  {
    ...base,
    id: "NX10",
    name: "Threshold",
    scale: "small",
    destinations: [3, 5],
    nested: false,
    dna: "The brand signs the entrance to the Hero; primary destinations form a broad threshold immediately after the opening scene. Navigation and image share a frame, not a component.",
    supportedAlignments: {
      brand: ["left", "center"],
      primary: ["split"],
      actions: right,
    },
    positions: ["flow"],
    utilities: ["cta"],
    scroll: ["static"],
    densities: ["comfortable"],
    desktop:
      "Small opening signature and menu shortcut, then Hero, then a full-width numbered destination shelf.",
    mobile:
      "Top shortcut opens an overlay index above the Hero; the post-Hero shelf becomes generous stacked destinations.",
    expansion:
      "Overlay index keeps navigation available before the Hero has been traversed.",
    constraints:
      "Flow or overlay header; shelf belongs to navigation and follows any selected Hero. Do not repeat the Hero CTA in the shelf.",
    motion:
      "Header supports the shared scroll policies; the threshold remains visible page content.",
    typography: ["luxury", "poster", "humanist"],
  },
  {
    ...base,
    id: "NX11",
    name: "Channel Directory",
    scale: "complex",
    destinations: [5, 8],
    nested: true,
    dna: "A vertical department selector controls an adjacent detail directory. Parent overview links remain separate from buttons that select their children.",
    supportedAlignments: { brand: left, primary: left, actions: right },
    positions: ["flow"],
    utilities: ["cta", "search"],
    scroll: ["static", "sticky"],
    desktop:
      "Compact signed header opens a two-pane capability browser with context for the selected department.",
    mobile:
      "Staged drilldown: choose a department, enter its destinations, return with an explicitly labelled Back button.",
    expansion:
      "Selected department and child directory; buttons use aria-pressed, not incomplete ARIA tabs.",
    constraints:
      "One child level, 5–8 departments. Not appropriate for flat three-link sites. Staged mobile focus moves to the child heading and back to the chosen department.",
    motion: "Short pane crossfade; no carousel/swipe requirement.",
    typography: ["humanist", "neo-grotesk", "technical"],
  },
  {
    ...base,
    id: "NX12",
    name: "Open Doors",
    scale: "small",
    destinations: [3, 5],
    nested: false,
    dna: "Three to five large labelled doors each own a destination and an ordinal. A compact signature opens or folds the entire entry board, with no conventional link rail.",
    supportedAlignments: {
      brand: ["left", "center"],
      primary: ["split"],
      actions: right,
    },
    positions: ["flow"],
    utilities: ["cta"],
    scroll: ["static"],
    densities: ["comfortable"],
    desktop:
      "Signature above an expandable horizontal board of oversized destinations; unequal door proportions express priority.",
    mobile:
      "Two-column board with the first destination spanning both columns, maintaining priority and generous touch areas.",
    expansion:
      "All destinations reveal in a graphic board rather than a list or megamenu.",
    constraints:
      "Flat IA only. Long labels wrap inside doors. No mandatory imagery, ornamental arrows or hover-dependent navigation.",
    motion:
      "Restrained board reveal now; door hinges/3D folding are proposals only and require future motion review.",
    typography: ["humanist", "playful", "brutalist"],
    art: ["salon", "billboard", "precision"],
  },
];

// Human-requested common behavior contract. Identity and slot alignments remain authored above.
export const navigationArchitectures: readonly NavigationArchitecture[] =
  authoredStudies.map((study) => ({
    ...study,
    positions:
      study.id === "NX04"
        ? ["floating"]
        : study.id === "NX09"
          ? ["edge"]
          : [...new Set([...study.positions, "overlay" as const])],
    backgrounds: ["solid"],
    scroll: [
      ...new Set([
        ...study.scroll,
        "sticky" as const,
        "reveal" as const,
        "solidify" as const,
        ...(study.id === "NX04" ? ["compact" as const] : []),
      ]),
    ],
    ...(study.id === "NX04"
      ? {
          floating: {
            dockStyle: ["capsule", "frame", "glass", "segmented"],
            dockAlignment: ["left", "center", "right"],
            dockWidth: ["compact", "wide"],
            dockOffset: ["close", "relaxed"],
            priorityLinks: ["none", "two", "three"],
          },
          utilities: ["cta", "search", "locale"],
        }
      : {}),
  }));
