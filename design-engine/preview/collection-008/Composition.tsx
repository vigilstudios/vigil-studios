"use client";
import { DesignThemeProvider } from "../../foundations/DesignThemeProvider";
import { IconSystemProvider } from "../../icons/IconSystemProvider";
import { CompositionGeometry } from "../../composition/CompositionGeometry";
import { renderSection } from "../../composition/render";
import {
  parseSection,
  type PageComposition,
  type SectionId,
  type SectionInstance,
} from "../../composition/schemas";
import {
  inspectComposition,
  resolveCreativeLayers,
} from "../../composition/validation";
import { getSectionContract } from "../../composition/catalog";
import { ThresholdShelf } from "../../sections/navigation/shared";
import { makeSection } from "../composition/fixtures";
import { ProofStudyPreview, type ProofMotion } from "./Study";
import { proofContexts, type StressMode } from "./fixtures";
import type { ProofStudy } from "./studies";
/** Review combinations only. Neither proof studies nor page recipes enter the production catalog. */
export const proofCompositionContexts: {
  id: string;
  name: string;
  nav: SectionId;
  hero: SectionId;
  before: SectionId[];
  after: SectionId[];
  note: string;
}[] = [
  {
    id: "scene",
    name: "NX04 Pocket Dock / HX01 Full Scene",
    nav: "navigation.pocket-dock",
    hero: "hero.full-scene",
    before: [],
    after: ["story.open-letter"],
    note: "Floating entrance and photographic scene → evidence → quiet brand voice. Inspect the measured safe area and the change in reading pace.",
  },
  {
    id: "poster",
    name: "NX06 Switchboard / HX02 Scene Poster",
    nav: "navigation.switchboard",
    hero: "hero.scene-poster",
    before: ["services.capability-manifesto"],
    after: ["work.light-table"],
    note: "Dense navigation and emphatic Hero → service proposition → proof → Work. Avoid repeating a giant metric in the adjacent service copy.",
  },
  {
    id: "comparison",
    name: "NX01 Datum / modified H12",
    nav: "navigation.datum",
    hero: "hero.comparison",
    before: [],
    after: ["commerce.merchant-edit"],
    note: "Compact H12 control panel → evidence → product assortment. E03 must describe a different transformation from the Hero comparison.",
  },
  {
    id: "editorial",
    name: "Existing Contents / Front Page",
    nav: "navigation.contents",
    hero: "hero.front-page",
    before: ["story.open-letter", "services.offering-index"],
    after: ["work.gallery-hanging"],
    note: "Editorial Nav/Hero → Story → Services → proof → Media. Dense register studies need the preceding Story pause.",
  },
  {
    id: "object",
    name: "Existing Island / H09 Object Study",
    nav: "navigation.island",
    hero: "hero.object-study",
    before: ["commerce.material-anatomy"],
    after: ["commerce.collection-atlas"],
    note: "Object Hero → product detail story → customer proof → collection. Media similarities are inspected as rhythm, not assumed endorsements.",
  },
  {
    id: "rail",
    name: "NX09 Margin Rail / H16 Vertical Record",
    nav: "navigation.margin-rail",
    hero: "hero.vertical-record",
    before: ["services.delivery-journey"],
    after: ["story.material-relay"],
    note: "Reserved navigation column remains outside every proof study; no Collection 008 section owns sticky geometry.",
  },
  {
    id: "threshold",
    name: "NX10 Threshold / HX01 Full Scene",
    nav: "navigation.threshold",
    hero: "hero.full-scene",
    before: ["story.object-biography"],
    after: ["services.evidence-in-practice"],
    note: "Post-Hero navigation shelf → object story → evidence → service practice. Repeated case imagery needs authoring review.",
  },
  {
    id: "original",
    name: "Existing Primary / Open Circuit",
    nav: "navigation.primary",
    hero: "hero.open-circuit",
    before: ["services.situation-responses"],
    after: ["work.contact-room"],
    note: "Original navigation and technical Hero → Services → proof → human Work context. Tests independence from the expanded photo Heroes.",
  },
];
export function makeProofComposition(
  contextIndex: number,
  adaptation: number,
): PageComposition {
  const f = proofCompositionContexts[contextIndex],
    c = proofContexts[adaptation];
  const nav = makeSection(f.nav, "navigation");
  const brandedNav = parseSection({
    ...nav,
    content: { ...nav.content, brand: c.brand },
  });
  const sections = [
    brandedNav,
    makeSection(f.hero, "opening"),
    ...f.before.map((id, i) =>
      makeSection(id, i === 0 ? "approach" : `before-${i}`),
    ),
    ...f.after.map((id, i) => makeSection(id, `after-${i}`)),
  ];
  // Retain each registered example's allowed creative-layer defaults, as in the existing Composition Lab.
  return {
    id: `proof-context-${f.id}`,
    label: f.name,
    site: {
      brand: {
        theme: "neutral",
        colors: {
          background: c.palette[0],
          surface: c.palette[0],
          foreground: c.palette[1],
          muted: c.palette[2],
          accent: c.palette[2],
          accentForeground: c.palette[0],
          border: c.palette[2],
        },
      },
      typography: "editorial",
      artDirection: "publication",
      icons: { id: "core", strokeWidth: 1.5 },
      motion: "none",
    },
    sections: sections.map((s) => {
      const contract = getSectionContract(s.component);
      return {
        ...s,
        overrides: {
          ...s.overrides,
          ...(contract.overrides.includes("typography")
            ? {
                typography: contract.typography.profiles.includes("editorial")
                  ? "editorial"
                  : contract.typography.profiles[0],
              }
            : {}),
          ...(contract.overrides.includes("artDirection")
            ? {
                artDirection: contract.artDirections.includes("publication")
                  ? "publication"
                  : contract.artDirections[0],
              }
            : {}),
        },
      } as SectionInstance;
    }),
  };
}
export function ProofComposition({
  study,
  adaptation = 0,
  contextIndex = 0,
  stress = "authored",
  motion = "live",
}: {
  study: ProofStudy;
  adaptation?: number;
  contextIndex?: number;
  stress?: StressMode;
  motion?: ProofMotion;
}) {
  const f = proofCompositionContexts[contextIndex],
    page = makeProofComposition(contextIndex, adaptation),
    nav = page.sections[0],
    hero = page.sections[1];
  const validation = inspectComposition(page);
  if (validation.issues.length)
    return (
      <div role="alert">
        Composition configuration error:{" "}
        {validation.issues.map((i) => i.message).join(" ")}
      </div>
    );
  const slot = (s: SectionInstance) => {
    const layers = resolveCreativeLayers(page.site, undefined, s.overrides);
    return (
      <div
        className="de-composition-slot"
        data-section={s.component}
        data-section-id={s.id}
        data-hero-section={s.id === "opening" ? "true" : undefined}
        key={s.id}
      >
        <DesignThemeProvider
          theme="neutral"
          overrides={{ color: page.site.brand.colors }}
          {...layers}
          className={s.id === "navigation" ? "de-navigation-root" : ""}
        >
          {s.id === "navigation" ? (
            <div id={s.id}>{renderSection(s)}</div>
          ) : (
            renderSection(s)
          )}
        </DesignThemeProvider>
      </div>
    );
  };
  return (
    <div className="c8-composition">
      <p className="c8-context-banner">
        Compatibility study · {f.name}. Production neighbors retain their
        illustrative source briefs. {f.note}
      </p>
      <IconSystemProvider>
        <div className="de-composition" role="region" aria-label={page.label}>
          <CompositionGeometry navigation={nav}>
            <div
              className="de-navigation-region"
              data-sticky={
                "settings" in nav && nav.settings.scroll !== "static"
              }
            >
              {slot(nav)}
            </div>
            <div className="de-composition-content">
              {slot(hero)}
              {nav.component === "navigation.threshold" && (
                <DesignThemeProvider
                  typography="editorial"
                  artDirection="publication"
                  motion="none"
                  overrides={{ color: page.site.brand.colors }}
                >
                  <ThresholdShelf section={nav} />
                </DesignThemeProvider>
              )}
              {page.sections.slice(2, 2 + f.before.length).map(slot)}
              <div id="proof">
                <ProofStudyPreview
                  study={study}
                  adaptation={adaptation}
                  stress={stress}
                  motion={motion}
                />
              </div>
              {page.sections.slice(2 + f.before.length).map(slot)}
            </div>
          </CompositionGeometry>
        </div>
      </IconSystemProvider>
    </div>
  );
}
