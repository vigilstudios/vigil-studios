import { makeEndingSection } from "./ending-fixtures";
import {
  adaptSectionExample,
  clientExample,
  clientAdaptationsFor,
} from "./client-adaptations";
import { immersiveFixture } from "./hero-expansion/fixtures";
import type { NavigationLogo } from "../sections/navigation/BrandMark";
import {
  makeExpansionSection,
  type ExpansionId,
} from "./navigation-hero-fixtures";
import { makeEvidenceSection } from "./evidence-fixtures";
import { makeImportSection } from "./import-fixtures";
import { configurationPatch } from "../composition/configuration";
import { CompositionGeometry } from "../composition/CompositionGeometry";
import { makeCommerceSection } from "./commerce-fixtures";
import { makeHeroFollowupSection } from "./hero-followup-fixtures";
import { makeServiceSection } from "./service-fixtures";
import { makeCollectionSection } from "./production-fixtures";
import { configurationReason } from "../registry/capabilities";
import type { ReactNode } from "react";
import {
  makeStorySection,
  type ContentLength,
} from "./collection-004/candidates";
import { makeSection } from "./composition/fixtures";
import { renderSection } from "../composition/render";
import { parseSection } from "../composition/schemas";
import { VigilIcon } from "../icons/VigilIcon";
import type { VigilIconName } from "../icons/names";
import { DesignButton } from "../primitives/DesignButton";
import { DesignContainer } from "../primitives/DesignContainer";
import {
  DesignBadge,
  DesignCard,
  DesignDivider,
  DesignGrid,
  DesignHeading,
  DesignLink,
  DesignMedia,
  DesignMediaFrame,
  DesignSection,
  DesignStack,
  DesignText,
} from "../primitives/DesignPrimitives";
import { FadeReveal } from "../motion/FadeReveal";
import { StaggerItem, StaggerReveal } from "../motion/StaggerReveal";
import { MaskReveal } from "../motion/MaskReveal";
import { SplitTextReveal } from "../motion/SplitTextReveal";
import { Parallax, ScrollScale, StickyScroll } from "../motion/ScrollBehaviors";
import { Marquee } from "../motion/Marquee";
import { MagneticInteraction, DepthShift } from "../motion/PointerBehaviors";
import { MediaReveal } from "../motion/MediaReveal";
import { HorizontalScroll } from "../motion/HorizontalScroll";
import { PrimaryNavigation } from "../sections/navigation/PrimaryNavigation";
import { StatementHero } from "../sections/heroes/StatementHero";
import { FeatureList } from "../sections/content/FeatureList";
import {
  getDesignComponent,
  type DesignComponentId,
} from "../registry/components";

const sampleLinks = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
];
const sampleImage = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="#aeb8bc"/><circle cx="580" cy="180" r="180" fill="#e9dfca"/><path d="M0 400L310 140L800 500H0Z" fill="#4e6571"/></svg>')}`;

/** Only declared choices can reach a renderer, including when driven by the Lab. */
export function resolvePreviewConfig(
  id: DesignComponentId,
  variantId: string,
  overrides: Readonly<Record<string, string>> = {},
): Record<string, string> {
  const definition = getDesignComponent(id);
  if (!definition) throw new Error(`Unknown Design Engine component: ${id}`);
  const variant = definition.previewVariants.find(
    (item) => item.id === variantId,
  );
  if (!variant) throw new Error(`Unknown preview variant: ${id}/${variantId}`);
  const config: Record<string, string> = { ...variant.config };
  for (const [name, value] of Object.entries(overrides)) {
    const field = definition.configurations.find((item) => item.name === name);
    if (!field || !(field.options as readonly string[]).includes(value))
      throw new Error(`Unsupported configuration: ${id}.${name}=${value}`);
    config[name] = value;
  }
  for (const [field, value] of Object.entries(config)) {
    const reason = configurationReason(definition, field, value, {});
    if (reason) throw new Error(reason);
  }
  return config;
}

/** Every ID has a real preview; this exhaustive switch is a build-time registration gate. */
export type PreviewClientOptions = {
  adaptation?: string;
  brand?: string;
  logo?: NavigationLogo;
  contextualActions?: import("../actions/schema").ContextualActions;
};
export function renderDesignPreview(
  id: DesignComponentId,
  variantId: string,
  overrides: Readonly<Record<string, string>> = {},
  client: PreviewClientOptions = {},
): ReactNode {
  const config = resolvePreviewConfig(id, variantId, overrides);
  if (
    client.adaptation &&
    client.adaptation !== "authored" &&
    !clientAdaptationsFor(id).some((c) => c.value === client.adaptation)
  )
    throw new Error(
      `Unsupported client adaptation: ${id}/${client.adaptation}`,
    );
  const adapted = Boolean(
      client.adaptation && client.adaptation !== "authored",
    ),
    context = clientExample(client.adaptation ?? "authored");
  const sampleFeatures = adapted
    ? context.links
        .slice(0, 3)
        .map((link) => ({ title: link.label, body: context.note }))
    : [
        {
          title: "Discover",
          body: "Start with the questions that matter and understand the context around them.",
        },
        {
          title: "Shape",
          body: "Bring the most useful ideas into focus through deliberate, practical choices.",
        },
        {
          title: "Deliver",
          body: "Create a clear path from a promising idea to a lasting result.",
        },
      ];
  const previewImage = adapted
    ? client.adaptation === "security"
      ? "/design-engine-study-003b/security-before.svg"
      : immersiveFixture(client.adaptation === "streetwear" ? 1 : 0).image.src
    : sampleImage;
  function withClient(
    section: import("../composition/schemas").SectionInstance,
  ) {
    const result = adaptSectionExample(
      section,
      client.adaptation ?? "authored",
      config.contentLength,
    );
    return result.component.startsWith("navigation.")
      ? parseSection({
          ...result,
          content: {
            ...result.content,
            ...(client.brand ? { brand: client.brand } : {}),
            ...(client.logo ? { logo: client.logo } : {}),
          },
        })
      : result;
  }
  const renderPreviewSection = (
    section: import("../composition/schemas").SectionInstance,
  ) => renderSection(parseSection({ ...withClient(section), ...(client.contextualActions ? { contextualActions: client.contextualActions } : {}) }));
  const card = (title: string) => (
    <div className="de-preview-motion-card">
      <p className="de-eyebrow">{adapted ? context.brand : "Design Engine"}</p>
      <h2>{adapted ? context.title : title}</h2>
    </div>
  );
  switch (id) {
    case "cta.editorial": case "cta.signal": case "contact.inquiry":
    case "footer.sitemap": case "footer.compact": case "footer.split": case "footer.banner":
    case "work.expand-rail": case "work.card-rail": case "work.image-expansion": case "work.image-gallery": case "work.apple-cards": case "work.liquid-glass": return renderPreviewSection(makeEndingSection(id,"individual-ending",config));
    case "hero.image-marquee":
    case "story.process-timeline":
    case "work.image-sphere": return renderPreviewSection(makeImportSection(id,"individual-import",config));
    case "navigation.datum":
    case "navigation.meridian":
    case "navigation.dispatch":
    case "navigation.pocket-dock":
    case "navigation.viewfinder":
    case "navigation.switchboard":
    case "navigation.atlas-hall":
    case "navigation.folio-takeover":
    case "navigation.margin-rail":
    case "navigation.threshold":
    case "navigation.channel-directory":
    case "navigation.open-doors":
    case "hero.full-scene":
    case "hero.scene-poster": {
      let section = makeExpansionSection(
        id as ExpansionId,
        "individual-expansion",
      );
      for (const [name, value] of Object.entries(config))
        if (name !== "geometry" && name !== "tone")
          section = parseSection({
            ...section,
            ...configurationPatch(section, name, value),
          });
      if ("treatment" in section)
        section = parseSection({
          ...section,
          treatment: { geometry: config.geometry, tone: config.tone },
        });
      if (section.component.startsWith("hero."))
        return renderPreviewSection(section);
      section = withClient(section);
      const hero = withClient(
        makeExpansionSection("hero.full-scene", "opening"),
      );
      return (
        <div className="de-composition">
          <CompositionGeometry navigation={section}>
            <div
              className="de-navigation-region"
              data-sticky={
                "settings" in section && section.settings.scroll !== "static"
              }
            >
              {renderSection(parseSection({ ...section, ...(client.contextualActions ? { contextualActions: client.contextualActions } : {}) }))}
            </div>
            <div className="de-composition-content">
              <div data-hero-section>{renderSection(hero)}</div>
              {renderSection(makeSection("content.feature-list", "approach"))}
              {renderSection(parseSection({ ...makeSection("content.feature-list", "services"), content: { title: "How we work", description: "From the first conversation to the finished result.", items: sampleFeatures }, structure: "list" }))}
              {renderSection(parseSection({ ...makeSection("content.feature-list", "contact"), content: { title: "Start a conversation", description: adapted ? context.note : "Tell us what you have in mind, what matters most, and where you would like to begin.", items: [{title:"Your next step",body:"Share the context and the outcome you are working toward."},{title:"A useful conversation",body:"Explore the possibilities and establish a clear starting point."},{title:"Moving forward",body:"Agree on the scope, responsibilities and next steps."}] }, structure: "list" }))}
            </div>
          </CompositionGeometry>
        </div>
      );
    }

    case "proof.margin-voice":
    case "proof.outcome-equation":
    case "proof.change-dossier":
    case "proof.case-cross-section":
    case "proof.credential-library":
    case "proof.moving-chorus":
    case "proof.review-reading-room":
    case "proof.in-conversation":
    case "proof.relationship-register":
    case "proof.progress-trail":
    case "proof.evidence-desk":
    case "proof.story-switchboard":
      return renderPreviewSection(makeEvidenceSection(id,"individual-evidence",config.adaptation,config.contentLength,config.motion,config));
    case "commerce.merchant-edit":
    case "commerce.catalog-ledger":
    case "commerce.object-pedestal":
    case "commerce.release-signal":
    case "commerce.collection-atlas":
    case "commerce.look-objects":
    case "commerce.campaign-interleave":
    case "commerce.material-anatomy":
    case "commerce.origin-receipt":
    case "commerce.inspection-desk":
    case "commerce.vertical-product-folio":
    case "commerce.option-atelier":
    case "commerce.comparison-bench":
    case "commerce.companion-rail":
      return renderPreviewSection(
        makeCommerceSection(
          id,
          "individual-commerce",
          config.adaptation,
          config.contentLength,
        ),
      );
    case "services.offering-index":
    case "services.capability-manifesto":
    case "services.capability-desk":
    case "services.expandable-offerings":
    case "services.situation-responses":
    case "services.delivery-journey":
    case "services.capability-coverage":
    case "services.connected-capabilities":
    case "services.service-field-atlas":
    case "services.evidence-in-practice":
    case "services.starting-point":
    case "services.scope-companions":
      return renderPreviewSection(
        makeServiceSection(
          id,
          "individual-service",
          config.adaptation,
          config.contentLength,
          config.motion,
        ),
      );
    case "work.gallery-hanging": {
      const section=makeCollectionSection(id,"individual-gallery",config.adaptation,config.contentLength);
      return renderPreviewSection(parseSection({...section,...Object.fromEntries(["layout","ratio","captions","density","motion"].map(k=>[k,config[k]]))}));
    }

    case "story.manifesto-fold":
    case "story.open-letter":
    case "story.material-relay":
    case "work.open-index":
    case "work.project-chapters":
    case "work.contact-room":
    case "work.screening-room":
    case "work.photographic-promenade":

    case "work.campaign-folio":
    case "work.look-closer":
    case "work.campaign-score":
    case "work.media-cabinet":
    case "work.light-table":
    case "work.viewport-gallery":
      return renderPreviewSection(
        makeCollectionSection(
          id,
          "individual-collection",
          config.adaptation,
          config.contentLength,
        ),
      );
    case "story.object-biography":
    case "story.working-conversation":
    case "story.decision-ledger": {
      const section = makeStorySection(
        id,
        "individual-story",
        config.adaptation,
        config.contentLength as ContentLength,
      );
      return renderPreviewSection(
        parseSection({
          ...section,
          structure: config.structure,
          motion: config.motion,
          ...("treatment" in section
            ? { treatment: { geometry: config.geometry, tone: config.tone } }
            : {}),
        }),
      );
    }
    case "hero.object-study":
    case "hero.vertical-record": {
      const section = makeHeroFollowupSection(
        id,
        "individual-hero",
        config.adaptation,
        config.contentLength,
        config.motion,
      );
      return renderPreviewSection(
        parseSection({
          ...section,
          treatment: { geometry: config.geometry, tone: config.tone },
        }),
      );
    }
    case "navigation.island":
    case "navigation.contents":
    case "hero.front-page":
    case "hero.open-circuit":
    case "hero.between-acts":
    case "hero.assembly":
    case "hero.comparison": {
      const section = makeSection(id, "individual-preview");
      const candidate = {
        ...section,
        structure: config.structure,
        motion: config.motion,
        ...(section.component === "hero.comparison"
          ? { contentAlignment: config.contentAlignment }
          : {}),
        ...("treatment" in section
          ? { treatment: { geometry: config.geometry, tone: config.tone } }
          : {}),
        ...("placement" in section ? { placement: config.placement } : {}),
      };
      return renderPreviewSection(parseSection(candidate));
    }
    case "primitive.button":
      return (
        <div className="de-preview-pad">
          <DesignButton
            variant={config.variant as "solid" | "outline"}
            size={config.size as "compact" | "comfortable"}
          >
            {adapted ? context.cta : "Explore the work"}
          </DesignButton>
        </div>
      );
    case "primitive.container":
      return (
        <div className="de-preview-pad">
          <DesignContainer width={config.width as "wide" | "reading"}>
            <div className="de-preview-measure">
              {adapted ? context.brand : "Container measure"} · {config.width}
            </div>
          </DesignContainer>
        </div>
      );
    case "primitive.section":
      return (
        <DesignSection
          tone={config.tone as "background" | "surface" | "elevated"}
          spacing={config.spacing as "compact" | "regular"}
        >
          <DesignContainer>
            <DesignHeading>
              {adapted ? context.title : "Section rhythm"}
            </DesignHeading>
            <DesignText tone="muted">
              {adapted
                ? context.note
                : "The section owns spacing and surface, not content."}
            </DesignText>
          </DesignContainer>
        </DesignSection>
      );
    case "primitive.stack":
      return (
        <div className="de-preview-pad">
          <DesignContainer>
            <DesignStack
              direction={config.direction as "vertical" | "horizontal"}
              gap={config.gap as "compact" | "regular" | "spacious"}
            >
              {sampleFeatures.map((item) => (
                <DesignBadge key={item.title}>{item.title}</DesignBadge>
              ))}
            </DesignStack>
          </DesignContainer>
        </div>
      );
    case "primitive.grid":
      return (
        <div className="de-preview-pad">
          <DesignContainer>
            <DesignGrid columns={Number(config.columns) as 2 | 3 | 4}>
              {sampleFeatures.map((item) => (
                <DesignCard key={item.title}>
                  <DesignHeading as="h3" scale="subsection">
                    {item.title}
                  </DesignHeading>
                </DesignCard>
              ))}
            </DesignGrid>
          </DesignContainer>
        </div>
      );
    case "primitive.heading":
      return (
        <div className="de-preview-pad">
          <DesignContainer>
            <DesignHeading
              as={config.as as "h1" | "h2" | "h3"}
              scale={config.scale as "display" | "section" | "subsection"}
            >
              {adapted ? context.title : "Ideas made clear."}
            </DesignHeading>
          </DesignContainer>
        </div>
      );
    case "primitive.text":
      return (
        <div className="de-preview-pad">
          <DesignContainer width="reading">
            <DesignText
              size={config.size as "lead" | "body" | "small"}
              tone={config.tone as "default" | "muted"}
            >
              {adapted
                ? context.note
                : "Good design gives each idea the space and clarity it needs."}
            </DesignText>
          </DesignContainer>
        </div>
      );
    case "primitive.link":
      return (
        <div className="de-preview-pad">
          <DesignContainer>
            <DesignLink
              href="#services"
              treatment={config.treatment as "plain" | "underline" | "arrow"}
            >
              {adapted ? context.cta : "Explore services"}
            </DesignLink>
          </DesignContainer>
        </div>
      );
    case "primitive.badge":
      return (
        <div className="de-preview-pad">
          <DesignContainer>
            <DesignBadge tone={config.tone as "neutral" | "accent"}>
              {adapted ? context.kind : "A clear label"}
            </DesignBadge>
          </DesignContainer>
        </div>
      );
    case "primitive.card":
      return (
        <div className="de-preview-pad">
          <DesignContainer width="reading">
            <DesignCard
              treatment={config.treatment as "bordered" | "raised" | "flat"}
            >
              <DesignHeading as="h3" scale="subsection">
                {adapted ? context.title : "A useful surface"}
              </DesignHeading>
              <DesignText tone="muted">
                {adapted
                  ? context.note
                  : "Room for content without a fixed brand style."}
              </DesignText>
            </DesignCard>
          </DesignContainer>
        </div>
      );
    case "primitive.media-frame":
      return (
        <div className="de-preview-pad">
          <DesignContainer width="reading">
            <DesignMediaFrame
              aspect={config.aspect as "wide" | "square" | "portrait"}
              caption={adapted ? context.kind : "Neutral composition study"}
            >
              <DesignMedia
                kind="image"
                src={previewImage}
                alt={
                  adapted
                    ? `Illustrative client adaptation image for ${context.kind}`
                    : "Abstract arrangement of shapes"
                }
              />
            </DesignMediaFrame>
          </DesignContainer>
        </div>
      );
    case "primitive.media":
      return (
        <div className="de-preview-pad">
          <DesignContainer width="reading">
            <DesignMediaFrame>
              <DesignMedia
                kind="image"
                src={previewImage}
                alt={
                  adapted
                    ? `Illustrative client adaptation image for ${context.kind}`
                    : "Abstract arrangement of shapes"
                }
                fit={config.fit as "cover" | "contain"}
              />
            </DesignMediaFrame>
          </DesignContainer>
        </div>
      );
    case "primitive.divider":
      return (
        <div className="de-preview-pad">
          <DesignContainer>
            <DesignText>{adapted ? context.brand : "Before"}</DesignText>
            <DesignDivider />
            <DesignText>{adapted ? context.note : "After"}</DesignText>
          </DesignContainer>
        </div>
      );
    case "navigation.primary":
      return (
        <PrimaryNavigation
          brand={client.brand ?? (adapted ? context.brand : "Your Brand")}
          logo={client.logo}
          links={
            adapted
              ? context.links
                  .slice(0, 5)
                  .map((l) => ({ label: l.label, href: "#approach" }))
              : sampleLinks
          }
          density={config.density as "compact" | "comfortable"}
          action={
            config.action === "present"
              ? {
                  label: adapted ? context.cta : "Get in touch",
                  href: "#contact",
                }
              : undefined
          }
        />
      );
    case "hero.statement":
      return (
        <StatementHero
          eyebrow={adapted ? context.kind : "A considered approach"}
          title={adapted ? context.title : "Make room for what matters."}
          description={
            adapted
              ? context.note
              : "A flexible introduction that gives each brand a distinct voice through its content, type, rhythm, and theme."
          }
          action={{
            label: adapted ? context.cta : "Explore services",
            href: "#services",
          }}
          secondaryAction={{ label: "Our approach", href: "#about" }}
          alignment={config.alignment as "start" | "center"}
          emphasis={config.emphasis as "quiet" | "strong"}
          motion={config.motion as "none" | "fade"}
        />
      );
    case "content.feature-list":
      return (
        <FeatureList
          eyebrow={adapted ? context.kind : "How it works"}
          title={
            adapted ? context.title : "A clear process, shaped around the work."
          }
          description={
            adapted
              ? context.note
              : "The same content structure can carry a compact list or a more spacious grid."
          }
          items={sampleFeatures}
          layout={config.layout as "grid" | "list"}
          motion={config.motion as "none" | "stagger"}
        />
      );
    case "motion.fade":
      return (
        <div className="de-preview-pad">
          <FadeReveal
            key={`${variantId}-${JSON.stringify(config)}`}
            distance={parseFloat(config.distance)}
            duration={parseFloat(config.duration)}
          >
            {card("One idea, brought into view.")}
          </FadeReveal>
        </div>
      );
    case "motion.stagger":
      return (
        <div className="de-preview-pad">
          <StaggerReveal
            key={`${variantId}-${JSON.stringify(config)}`}
            interval={parseFloat(config.interval)}
            className="de-preview-stagger"
          >
            {sampleFeatures.map((item) => (
              <StaggerItem key={item.title}>{card(item.title)}</StaggerItem>
            ))}
          </StaggerReveal>
        </div>
      );
    case "motion.mask":
      return (
        <div className="de-preview-pad">
          <MaskReveal
            key={`${variantId}-${config.direction}`}
            direction={config.direction as "left" | "right" | "bottom"}
          >
            {card("A change in perspective.")}
          </MaskReveal>
        </div>
      );
    case "motion.split-text":
      return (
        <div className="de-preview-pad">
          <DesignContainer>
            <DesignHeading>
              <SplitTextReveal
                key={`${variantId}-${config.interval}`}
                text={adapted ? context.title : "Words shape the moment."}
                interval={parseFloat(config.interval)}
              />
            </DesignHeading>
          </DesignContainer>
        </div>
      );
    case "motion.parallax":
      return (
        <div className="de-preview-pad">
          <Parallax distance={parseFloat(config.distance)}>
            {card("A slower layer.")}
          </Parallax>
        </div>
      );
    case "motion.scroll-scale":
      return (
        <div className="de-preview-pad">
          <ScrollScale from={parseFloat(config.from)}>
            {card("A measured entrance.")}
          </ScrollScale>
        </div>
      );
    case "motion.sticky-scroll":
      return (
        <div className="de-preview-pad">
          <StickyScroll showProgress={config.showProgress === "yes"}>
            {card("A pinned moment in the story.")}
          </StickyScroll>
        </div>
      );
    case "motion.marquee":
      return (
        <div className="de-preview-pad">
          <Marquee
            duration={parseFloat(config.duration)}
            items={
              adapted
                ? context.links.slice(0, 4).map((l) => l.label)
                : ["Research", "Explore", "Refine", "Deliver"]
            }
          />
        </div>
      );
    case "motion.magnetic":
      return (
        <div className="de-preview-pad">
          <DesignContainer>
            <MagneticInteraction strength={parseFloat(config.strength)}>
              <DesignButton>
                {adapted ? context.cta : "Move the pointer"}
              </DesignButton>
            </MagneticInteraction>
          </DesignContainer>
        </div>
      );
    case "motion.depth-shift":
      return (
        <div className="de-preview-pad">
          <DesignContainer width="reading">
            <DepthShift maxDegrees={parseFloat(config.maxDegrees)}>
              {card("A little depth.")}
            </DepthShift>
          </DesignContainer>
        </div>
      );
    case "motion.media-reveal":
      return (
        <div className="de-preview-pad">
          <DesignContainer width="reading">
            <MediaReveal duration={parseFloat(config.duration)}>
              <DesignMediaFrame>
                <DesignMedia
                  kind="image"
                  src={previewImage}
                  alt={
                    adapted
                      ? `Illustrative client adaptation image for ${context.kind}`
                      : "Abstract arrangement of shapes"
                  }
                />
              </DesignMediaFrame>
            </MediaReveal>
          </DesignContainer>
        </div>
      );
    case "motion.horizontal-scroll":
      return (
        <div className="de-preview-pad">
          <HorizontalScroll label="Ideas">
            {sampleFeatures.map((item) => (
              <DesignCard key={item.title}>
                <DesignHeading as="h3" scale="subsection">
                  {item.title}
                </DesignHeading>
                <DesignText tone="muted">{item.body}</DesignText>
              </DesignCard>
            ))}
          </HorizontalScroll>
        </div>
      );
    case "icon.core":
      return (
        <div className="de-preview-pad">
          <DesignContainer>
            <div className="de-preview-icon">
              <VigilIcon
                name={config.name as VigilIconName}
                label={config.name.replaceAll("-", " ")}
                size={Number(config.size)}
                strokeWidth={Number(config.strokeWidth)}
              />
              <DesignText size="small">
                {config.name}
                {adapted ? ` · ${context.brand}` : ""}
              </DesignText>
            </div>
          </DesignContainer>
        </div>
      );
  }
  return assertNever(id);
}

function assertNever(id: never): never {
  throw new Error(`No preview renderer for ${id}`);
}
