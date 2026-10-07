import { makeEndingSection } from "./ending-fixtures";
import { endingSectionIds, type EndingSectionId } from "../composition/ending-schemas";
import { makeImportSection } from "./import-fixtures";
import { importSectionIds, type ImportSectionId } from "../composition/import-schemas";
import {
  getDesignComponent,
  type DesignComponentId,
} from "../registry/components";
import { parseSection, type SectionInstance } from "../composition/schemas";
import {
  navigationIds,
  architectureFor,
  type ExpansionNavigationId,
} from "../navigation/capabilities";
import { navigationContexts } from "./client-navigation-contexts";
import { immersiveFixture } from "./hero-expansion/fixtures";
import { heroFixture, type BrandTreatment } from "./collection-003b/fixtures";
import {
  makeStorySection,
  type StoryCandidateId,
} from "./collection-004/candidates";
import {
  makeCollectionSection,
  productionCollectionIds,
  type ProductionCollectionId,
} from "./production-fixtures";
import {
  makeHeroFollowupSection,
  type HeroFollowupId,
} from "./hero-followup-fixtures";
import { makeServiceSection } from "./service-fixtures";
import type { ServiceSectionId } from "../composition/service-schemas";
import { makeEvidenceSection } from "./evidence-fixtures";
import type { EvidenceSectionId } from "../composition/evidence-schemas";
import { makeCommerceSection } from "./commerce-fixtures";
import type { CommerceSectionId } from "../composition/commerce-schemas";
import type { NavigationLogo } from "../sections/navigation/BrandMark";
import { storyAdaptations } from "./collection-004/fixtures";
import { mediaBriefs } from "./collection-005/fixtures";
import { serviceContexts } from "./collection-006/fixtures";
import { commerceContexts } from "./collection-007/fixtures";

const labels: Record<string, string> = {
  authored: "Original example",
  architecture: "Architecture practice",
  streetwear: "Independent apparel",
  security: "Cybersecurity platform",
  performance: "Performance ensemble",
  apparel: "Independent apparel",
  hospitality: "Hospitality",
  urban: "Urban apparel",
  workshop: "Independent workshop",
  community: "Community program",
  research: "Research practice",
  professional: "Architecture practice",
  platform: "Data infrastructure platform",
  program: "Community learning program",
  beauty: "Beauty and skincare",
  audio: "Audio products",
};
/** Preview choices are client examples, not runtime structure/configuration fields. */
export function clientAdaptationsFor(id: DesignComponentId) {
  const declared = getDesignComponent(id)?.configurations.find(
    (f) => f.name === "adaptation",
  )?.options;
  const values = declared ?? [
    "authored",
    "architecture",
    "streetwear",
    ...(id === "hero.full-scene" || id === "hero.scene-poster"
      ? ["performance"]
      : []),
    "security",
  ];
  return values.map((value) => {
    let label = labels[value] ?? value;
    if (declared) {
      if (id.startsWith("services.")) {
        const c =
          serviceContexts[
            value === "platform" ? 1 : value === "program" ? 2 : 0
          ];
        label = `${c.brand} · ${c.context}`;
      } else if (id.startsWith("commerce.")) {
        const c =
          commerceContexts[value === "beauty" ? 1 : value === "audio" ? 2 : 0];
        label = `${c.brand} · ${c.context}`;
      } else if (id.startsWith("work.")) {
        const c =
          mediaBriefs[
            value === "urban"
              ? 3
              : value === "apparel"
                ? 0
                : value === "hospitality"
                  ? 2
                  : 1
          ];
        label = `${c.brand} · ${c.context}`;
      } else if (id.startsWith("story.")) {
        const index = ["workshop", "community", "research"].includes(value)
            ? ["workshop", "community", "research"].indexOf(value)
            : value === "apparel"
              ? 0
              : value === "hospitality"
                ? 2
                : 1,
          c = storyAdaptations[index];
        label = `${c.client} · ${c.context}`;
      } else if (id === "hero.object-study")
        label =
          (
            {
              professional: "Object and material studio",
              platform: "Coastal architecture practice",
              program: "Independent learning program",
            } as Record<string, string>
          )[value] ?? label;
      else if (id === "hero.vertical-record")
        label =
          (
            {
              professional: "Performance practice",
              platform: "Coastal architecture practice",
              program: "Independent learning program",
            } as Record<string, string>
          )[value] ?? label;
    }
    return { value, label };
  });
}
export function clientExample(adaptation: string) {
  return (
    navigationContexts.find((c) => c.id === adaptation) ?? navigationContexts[0]
  );
}
export function exampleLogo(
  brand: string,
  kind: BrandTreatment,
): NavigationLogo {
  if (kind === "text" || kind === "wordmark") return { kind };
  const c =
    navigationContexts.find((c) => c.brand === brand) ?? navigationContexts[0];
  if (kind === "image")
    return {
      kind,
      src: `/design-engine-study-003b/${c.id}.svg`,
      width: 360,
      height: 68,
    };
  const path =
    c.id === "security"
      ? "M6 6h36v12H18v12h24v12H6V30h24V18H6z"
      : c.id === "streetwear"
        ? "M4 4h16v16h8V4h16v40H28V28h-8v16H4z"
        : "M4 40V8h18v12H12v12h24V20H26V8h18v32z";
  return {
    kind,
    src:
      "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="${path}" fill="${c.palette[1]}"/></svg>`,
      ),
  };
}
/** Load example content/media while retaining authored structure, motion and creative layers. */
export function adaptSectionExample(
  section: SectionInstance,
  adaptation: string,
  length = "standard",
): SectionInstance {
  if (!adaptation || adaptation === "authored") return section;
  const id = section.component;
  if (
    !clientAdaptationsFor(id as DesignComponentId).some(
      (c) => c.value === adaptation,
    )
  )
    throw Error(`Unsupported client adaptation: ${id}/${adaptation}`);
  let data: SectionInstance;
  if (endingSectionIds.includes(id as EndingSectionId))
    data = makeEndingSection(id as EndingSectionId,section.id,{adaptation,contentLength:length});
  else if ((importSectionIds as readonly string[]).includes(id))
    data = makeImportSection(id as ImportSectionId,section.id,{adaptation,contentLength:length});
  else if ((productionCollectionIds as readonly string[]).includes(id))
    data = makeCollectionSection(
      id as ProductionCollectionId,
      section.id,
      adaptation,
      length,
    );
  else if (id.startsWith("services."))
    data = makeServiceSection(
      id as ServiceSectionId,
      section.id,
      adaptation,
      length,
      section.motion,
    );
  else if (id.startsWith("proof."))
    data = makeEvidenceSection(id as EvidenceSectionId,section.id,adaptation,length,section.motion);
  else if (id.startsWith("commerce."))
    data = makeCommerceSection(
      id as CommerceSectionId,
      section.id,
      adaptation,
      length,
    );
  else if (
    [
      "story.object-biography",
      "story.working-conversation",
      "story.decision-ledger",
    ].includes(id)
  )
    data = makeStorySection(
      id as StoryCandidateId,
      section.id,
      adaptation,
      length as "standard" | "short" | "long",
    );
  else if (id === "hero.object-study" || id === "hero.vertical-record")
    data = makeHeroFollowupSection(
      id as HeroFollowupId,
      section.id,
      adaptation,
      length,
      section.motion,
    );
  else if (id === "hero.full-scene" || id === "hero.scene-poster") {
    const context = clientExample(adaptation),
      fixture = immersiveFixture(
        adaptation === "streetwear" ? 1 : adaptation === "performance" ? 2 : 0,
        section.id,
      );
    const { image, id: unused, ...content } = fixture;
    void unused;
    data = parseSection({
      ...section,
      content:
        adaptation === "security"
          ? {
              eyebrow: context.kind,
              title: context.title,
              description: context.note,
              reference: context.brand,
              action: { label: context.cta, href: "#approach" },
            }
          : { ...content, action: { ...content.action, href: "#approach" } },
      media: {
        image:
          adaptation === "security"
            ? {
                src: "/design-engine-study-003b/security-before.svg",
                alt: "Illustrative network topology",
                width: 1600,
                height: 900,
              }
            : image,
      },
    });
  } else if (id.startsWith("navigation.")) {
    const context = clientExample(adaptation),
      expansion = (navigationIds as readonly string[]).includes(id),
      a = expansion ? architectureFor(id as ExpansionNavigationId) : undefined;
    const content = {
      ...section.content,
      brand: context.brand,
      home: "#opening",
      links: context.links
        .slice(0, a?.destinations[1] ?? (id === "navigation.island" ? 4 : 7))
        .map((l) => ({
          label: l.label,
          href: "#approach",
          ...(a?.nested && "children" in l
            ? {
                children: l.children.map((label) => ({
                  label,
                  href: "#approach",
                })),
              }
            : {}),
        })),
      action: { label: context.cta, href: "#approach" },
      ...(a ? { kind: context.kind, note: context.note } : {}),
      ...("logo" in section.content && section.content.logo
        ? { logo: exampleLogo(context.brand, section.content.logo.kind) }
        : {}),
    };
    data = parseSection({ ...section, content });
  } else if (id.startsWith("hero.")) {
    data = heroFixture(
      id as Parameters<typeof heroFixture>[0],
      clientExample(adaptation),
      section.id,
    );
    // Pair registration stays valid when an apparel example uses a portrait second view.
    if (data.component === "hero.comparison" && adaptation === "streetwear")
      data = {
        ...data,
        media: {
          before: data.media.before,
          after: {
            ...data.media.before,
            src: "/design-engine-study-007/fashion-gym.webp",
          },
        },
      };
    if (data.component === "hero.assembly") {
      const c = clientExample(adaptation),
        partNames =
          adaptation === "architecture"
            ? ["Foundation", "Frame", "Threshold", "Roof"]
            : adaptation === "streetwear"
              ? ["Outer shell", "Inner layer", "Fastening", "Finish"]
              : ["Collect", "Assess", "Respond", "Review"];
      data = {
        ...data,
        content: { ...data.content, specification: c.note.slice(0, 150) },
        media: {
          assembly: {
            ...data.media.assembly,
            label: c.kind,
            parts: data.media.assembly.parts.map((p, i) => ({
              ...p,
              label: partNames[i],
              specification: c.note.slice(0, 150),
            })),
          },
        },
      };
    }
    data = parseSection(data);
  } else {
    const c = clientExample(adaptation);
    data = parseSection({
      ...section,
      content: {
        ...section.content,
        title: c.title,
        description: c.note,
        eyebrow: c.kind,
      },
    });
  }
  return parseSection({
    ...section,
    content: data.content,
    ...("media" in data ? { media: data.media } : {}),
  });
}
export function adaptationDataPatch(
  section: SectionInstance,
  adaptation: string,
) {
  const data = adaptSectionExample(section, adaptation);
  return {
    content: data.content,
    ...("media" in data ? { media: data.media } : {}),
  };
}
