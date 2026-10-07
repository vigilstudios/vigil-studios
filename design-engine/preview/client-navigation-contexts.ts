/** Shared Lab-only client examples; production components import no fixtures. */
export const navigationContexts = [
  {
    id: "architecture",
    brand: "COMMON / GROUND",
    short: "C/G",
    kind: "Architecture practice",
    logo: "wordmark",
    palette: ["#ece8dd", "#252f28", "#405344"],
    cta: "Discuss a place",
    note: "Architecture, landscapes and the life between them.",
    title: "Places for a shared future.",
    links: [
      {
        label: "Practice",
        children: ["Our approach", "People", "Studio life"],
      },
      { label: "Places", children: ["Civic spaces", "Homes", "Landscape"] },
      { label: "Journal", children: ["Field notes", "Conversations"] },
      { label: "Contact" },
      { label: "Research", children: ["Materials", "Climate"] },
      { label: "Careers" },
    ],
  },
  {
    id: "streetwear",
    brand: "OFF HOURS",
    short: "OH",
    kind: "Independent streetwear",
    logo: "image",
    palette: ["#ebed36", "#171715", "#171715"],
    cta: "Explore the drop",
    note: "Made for the hours that belong to you. Independent apparel, edition 06.",
    title: "Outside the ordinary.",
    links: [
      { label: "New arrivals", children: ["Drop 06", "All arrivals"] },
      {
        label: "Collections",
        children: ["Outer layers", "Everyday uniform", "Objects"],
      },
      { label: "Campaign", children: ["After dark", "Open streets"] },
      { label: "Stores" },
      { label: "Archive", children: ["Edition 05", "Edition 04"] },
      { label: "About" },
      { label: "Care guide" },
    ],
  },
  {
    id: "security",
    brand: "SECTOR ZERO",
    short: "S0",
    kind: "Cybersecurity platform",
    logo: "combined",
    palette: ["#e3edf3", "#122b40", "#174d70"],
    cta: "Request a walkthrough",
    note: "Make security decisions with a clear view of your systems. Illustrative platform; no certification claims.",
    title: "Know where you stand.",
    links: [
      {
        label: "Platform",
        children: [
          "Exposure overview",
          "Signal analysis",
          "Workflow automation",
        ],
      },
      {
        label: "Solutions",
        children: ["Security teams", "Engineering", "Operations"],
      },
      { label: "Resources", children: ["Documentation", "Research", "Guides"] },
      { label: "Company", children: ["About us", "Careers"] },
      {
        label: "Partners",
        children: ["Technology partners", "Partner program"],
      },
      { label: "Support" },
      { label: "Contact" },
      { label: "Developers", children: ["API overview", "Integrations"] },
    ],
  },
] as const;
export type NavigationContext = (typeof navigationContexts)[number];
