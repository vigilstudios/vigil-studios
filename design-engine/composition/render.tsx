import { EditorialConversion, SignalConversion } from "../sections/endings/Conversion";
import { InquiryContact } from "../sections/endings/InquiryContact";
import { SitemapFooter, CompactFooter, SplitFooter, BannerFooter } from "../sections/endings/Footers";
import { ExpandRailGallery, CardRailGallery } from "../sections/endings/Galleries";
import { ImageExpansionSlider } from "../../components/ui/image-expansion";
import { ImageGallery } from "../../components/ui/image-gallery";
import AppleCardCarousel from "../../components/ui/carousel-08";
import { LiquidGlassCarousel } from "../../components/ui/liquid-glass-carousel";
import { ImageMarqueeHero } from "../sections/imports/ImageMarqueeHero";
import { ProcessTimeline } from "../sections/imports/ProcessTimeline";
import { ImageSphere } from "../sections/imports/ImageSphere";
import { SectionActionProvider } from "../actions/ActionContext";
import { MarginVoice } from "../sections/proof/MarginVoice";
import { OutcomeEquation } from "../sections/proof/OutcomeEquation";
import { ChangeDossier } from "../sections/proof/ChangeDossier";
import { CaseCrossSection } from "../sections/proof/CaseCrossSection";
import { CredentialLibrary } from "../sections/proof/CredentialLibrary";
import { MovingChorus } from "../sections/proof/MovingChorus";
import { ReviewReadingRoom } from "../sections/proof/ReviewReadingRoom";
import { InConversation } from "../sections/proof/InConversation";
import { RelationshipRegister } from "../sections/proof/RelationshipRegister";
import { ProgressTrail } from "../sections/proof/ProgressTrail";
import { EvidenceDesk } from "../sections/proof/EvidenceDesk";
import { StorySwitchboard } from "../sections/proof/StorySwitchboard";
import { DatumNavigation } from "../sections/navigation/DatumNavigation";
import { MeridianNavigation } from "../sections/navigation/MeridianNavigation";
import { DispatchNavigation } from "../sections/navigation/DispatchNavigation";
import { PocketDockNavigation } from "../sections/navigation/PocketDockNavigation";
import { ViewfinderNavigation } from "../sections/navigation/ViewfinderNavigation";
import { SwitchboardNavigation } from "../sections/navigation/SwitchboardNavigation";
import { AtlasHallNavigation } from "../sections/navigation/AtlasHallNavigation";
import { FolioTakeoverNavigation } from "../sections/navigation/FolioTakeoverNavigation";
import { MarginRailNavigation } from "../sections/navigation/MarginRailNavigation";
import { ThresholdNavigation } from "../sections/navigation/ThresholdNavigation";
import { ChannelDirectoryNavigation } from "../sections/navigation/ChannelDirectoryNavigation";
import { OpenDoorsNavigation } from "../sections/navigation/OpenDoorsNavigation";
import {FullSceneHero} from "../sections/heroes/FullSceneHero";
import {ScenePosterHero} from "../sections/heroes/ScenePosterHero";
import {CompositionGeometry} from "./CompositionGeometry";
import {ThresholdShelf} from "../sections/navigation/shared";
import { MerchantEdit } from "../sections/commerce/MerchantEdit";
import { CatalogLedger } from "../sections/commerce/CatalogLedger";
import { ObjectPedestal } from "../sections/commerce/ObjectPedestal";
import { ReleaseSignal } from "../sections/commerce/ReleaseSignal";
import { CollectionAtlas } from "../sections/commerce/CollectionAtlas";
import { LookObjects } from "../sections/commerce/LookObjects";
import { CampaignInterleave } from "../sections/commerce/CampaignInterleave";
import { MaterialAnatomy } from "../sections/commerce/MaterialAnatomy";
import { OriginReceipt } from "../sections/commerce/OriginReceipt";
import { InspectionDesk } from "../sections/commerce/InspectionDesk";
import { VerticalProductFolio } from "../sections/commerce/VerticalProductFolio";
import { OptionAtelier } from "../sections/commerce/OptionAtelier";
import { ComparisonBench } from "../sections/commerce/ComparisonBench";
import { CompanionRail } from "../sections/commerce/CompanionRail";
import { ObjectStudyHero } from "../sections/heroes/ObjectStudyHero";
import { VerticalRecordHero } from "../sections/heroes/VerticalRecordHero";
import { OfferingIndex } from "../sections/services/OfferingIndex";
import { CapabilityManifesto } from "../sections/services/CapabilityManifesto";
import { CapabilityDesk } from "../sections/services/CapabilityDesk";
import { ExpandableOfferings } from "../sections/services/ExpandableOfferings";
import { SituationResponses } from "../sections/services/SituationResponses";
import { DeliveryJourney } from "../sections/services/DeliveryJourney";
import { CapabilityCoverage } from "../sections/services/CapabilityCoverage";
import { ConnectedCapabilities } from "../sections/services/ConnectedCapabilities";
import { ServiceFieldAtlas } from "../sections/services/ServiceFieldAtlas";
import { EvidenceInPractice } from "../sections/services/EvidenceInPractice";
import { StartingPoint } from "../sections/services/StartingPoint";
import { ScopeCompanions } from "../sections/services/ScopeCompanions";
import { MaterialRelay } from "../sections/storytelling/MaterialRelay";
import { OpenLetter } from "../sections/storytelling/OpenLetter";
import { ManifestoFold } from "../sections/storytelling/ManifestoFold";
import { LightTable } from "../sections/work/LightTable";
import { ViewportGallery } from "../sections/work/ViewportGallery";
import { MediaCabinet } from "../sections/work/MediaCabinet";
import { CampaignScore } from "../sections/work/CampaignScore";
import { LookCloser } from "../sections/work/LookCloser";
import { CampaignFolio } from "../sections/work/CampaignFolio";
import { GalleryHanging } from "../sections/work/GalleryHanging";
import { PhotographicPromenade } from "../sections/work/PhotographicPromenade";
import { ScreeningRoom } from "../sections/work/ScreeningRoom";
import { ContactRoom } from "../sections/work/ContactRoom";
import { ProjectChapters } from "../sections/work/ProjectChapters";
import { OpenIndex } from "../sections/work/OpenIndex";
import { ObjectBiography } from "../sections/storytelling/ObjectBiography";
import { WorkingConversation } from "../sections/storytelling/WorkingConversation";
import { DecisionLedger } from "../sections/storytelling/DecisionLedger";
import type { ReactNode } from "react";
import type { FontBindings } from "../foundations/typography/types";
import type { VigilIconPack } from "../icons/registry";
import { DesignThemeProvider } from "../foundations/DesignThemeProvider";
import { IconSystemProvider } from "../icons/IconSystemProvider";
import { PrimaryNavigation } from "../sections/navigation/PrimaryNavigation";
import { IslandNavigation } from "../sections/navigation/IslandNavigation";
import { ContentsNavigation } from "../sections/navigation/ContentsNavigation";
import { StatementHero } from "../sections/heroes/StatementHero";
import { FrontPageHero } from "../sections/heroes/FrontPageHero";
import { OpenCircuitHero } from "../sections/heroes/OpenCircuitHero";
import { BetweenActsHero } from "../sections/heroes/BetweenActsHero";
import { AssemblyHero } from "../sections/heroes/AssemblyHero";
import { ComparisonHero } from "../sections/heroes/ComparisonHero";
import { FeatureList } from "../sections/content/FeatureList";
import { getSectionContract } from "./catalog";
import { assertComposition, resolveCreativeLayers } from "./validation";
import type { PageComposition, SectionInstance } from "./schemas";

/** Exhaustive, typed implementation routing. It contains no calibration copy/media. */
export function renderSection(section: SectionInstance): ReactNode {
  return <SectionActionProvider section={section}>{renderSectionBody(section)}</SectionActionProvider>;
}
function renderSectionBody(section: SectionInstance): ReactNode {
  switch (section.component) {
    case "cta.editorial": return <EditorialConversion {...section}/>;
    case "cta.signal": return <SignalConversion {...section}/>;
    case "contact.inquiry": return <InquiryContact {...section}/>;
    case "footer.sitemap": return <SitemapFooter {...section}/>;
    case "footer.compact": return <CompactFooter {...section}/>;
    case "footer.split": return <SplitFooter {...section}/>;
    case "footer.banner": return <BannerFooter {...section}/>;
    case "work.expand-rail": return <ExpandRailGallery {...section}/>;
    case "work.card-rail": return <CardRailGallery {...section}/>;
    case "work.image-expansion": return <ImageExpansionSlider {...section}/>;
    case "work.image-gallery": return <ImageGallery {...section}/>;
    case "work.apple-cards": return <AppleCardCarousel {...section}/>;
    case "work.liquid-glass": return <LiquidGlassCarousel {...section}/>;
    case "hero.image-marquee": return <ImageMarqueeHero {...section}/>;
    case "story.process-timeline": return <ProcessTimeline {...section}/>;
    case "work.image-sphere": return <ImageSphere {...section}/>;
    case "proof.margin-voice": return <MarginVoice {...section}/>;
    case "proof.outcome-equation": return <OutcomeEquation {...section}/>;
    case "proof.change-dossier": return <ChangeDossier {...section}/>;
    case "proof.case-cross-section": return <CaseCrossSection {...section}/>;
    case "proof.credential-library": return <CredentialLibrary {...section}/>;
    case "proof.moving-chorus": return <MovingChorus {...section}/>;
    case "proof.review-reading-room": return <ReviewReadingRoom {...section}/>;
    case "proof.in-conversation": return <InConversation {...section}/>;
    case "proof.relationship-register": return <RelationshipRegister {...section}/>;
    case "proof.progress-trail": return <ProgressTrail {...section}/>;
    case "proof.evidence-desk": return <EvidenceDesk {...section}/>;
    case "proof.story-switchboard": return <StorySwitchboard {...section}/>;
    case "navigation.datum": return <DatumNavigation section={section}/>;
    case "navigation.meridian": return <MeridianNavigation section={section}/>;
    case "navigation.dispatch": return <DispatchNavigation section={section}/>;
    case "navigation.pocket-dock": return <PocketDockNavigation section={section}/>;
    case "navigation.viewfinder": return <ViewfinderNavigation section={section}/>;
    case "navigation.switchboard": return <SwitchboardNavigation section={section}/>;
    case "navigation.atlas-hall": return <AtlasHallNavigation section={section}/>;
    case "navigation.folio-takeover": return <FolioTakeoverNavigation section={section}/>;
    case "navigation.margin-rail": return <MarginRailNavigation section={section}/>;
    case "navigation.threshold": return <ThresholdNavigation section={section}/>;
    case "navigation.channel-directory": return <ChannelDirectoryNavigation section={section}/>;
    case "navigation.open-doors": return <OpenDoorsNavigation section={section}/>;
    case "hero.full-scene": return <FullSceneHero {...section}/>;
    case "hero.scene-poster": return <ScenePosterHero {...section}/>;
    case "commerce.merchant-edit": return <MerchantEdit {...section} />;
    case "commerce.catalog-ledger": return <CatalogLedger {...section} />;
    case "commerce.object-pedestal": return <ObjectPedestal {...section} />;
    case "commerce.release-signal": return <ReleaseSignal {...section} />;
    case "commerce.collection-atlas": return <CollectionAtlas {...section} />;
    case "commerce.look-objects": return <LookObjects {...section} />;
    case "commerce.campaign-interleave": return <CampaignInterleave {...section} />;
    case "commerce.material-anatomy": return <MaterialAnatomy {...section} />;
    case "commerce.origin-receipt": return <OriginReceipt {...section} />;
    case "commerce.inspection-desk": return <InspectionDesk {...section} />;
    case "commerce.vertical-product-folio": return <VerticalProductFolio {...section} />;
    case "commerce.option-atelier": return <OptionAtelier {...section} />;
    case "commerce.comparison-bench": return <ComparisonBench {...section} />;
    case "commerce.companion-rail": return <CompanionRail {...section} />;

    case "services.offering-index": return <OfferingIndex {...section} />;
    case "services.capability-manifesto": return <CapabilityManifesto {...section} />;
    case "services.capability-desk": return <CapabilityDesk {...section} />;
    case "services.expandable-offerings": return <ExpandableOfferings {...section} />;
    case "services.situation-responses": return <SituationResponses {...section} />;
    case "services.delivery-journey": return <DeliveryJourney {...section} />;
    case "services.capability-coverage": return <CapabilityCoverage {...section} />;
    case "services.connected-capabilities": return <ConnectedCapabilities {...section} />;
    case "services.service-field-atlas": return <ServiceFieldAtlas {...section} />;
    case "services.evidence-in-practice": return <EvidenceInPractice {...section} />;
    case "services.starting-point": return <StartingPoint {...section} />;
    case "services.scope-companions": return <ScopeCompanions {...section} />;
    case "work.viewport-gallery": return <ViewportGallery {...section} />;
    case "story.material-relay": return <MaterialRelay {...section} />;
    case "story.open-letter": return <OpenLetter {...section} />;
    case "story.manifesto-fold": return <ManifestoFold {...section} />;
    case "work.light-table": return <LightTable {...section} />;
    case "work.media-cabinet": return <MediaCabinet {...section} />;
    case "work.campaign-score": return <CampaignScore {...section} />;
    case "work.look-closer": return <LookCloser {...section} />;
    case "work.campaign-folio": return <CampaignFolio {...section} />;
    case "work.gallery-hanging": return <GalleryHanging {...section} />;
    case "work.photographic-promenade": return <PhotographicPromenade {...section} />;
    case "work.screening-room": return <ScreeningRoom {...section} />;
    case "work.contact-room": return <ContactRoom {...section} />;
    case "work.project-chapters": return <ProjectChapters {...section} />;
    case "work.open-index": return <OpenIndex {...section} />;
    case "story.object-biography": return <ObjectBiography {...section} />;
    case "story.working-conversation": return <WorkingConversation {...section} />;
    case "story.decision-ledger": return <DecisionLedger key={section.structure} {...section} />;
    case "navigation.primary": return <PrimaryNavigation {...section.content} density={section.structure} />;
    case "navigation.island": return <IslandNavigation {...section} />;
    case "navigation.contents": return <ContentsNavigation {...section} />;
    case "hero.statement": return <StatementHero id={section.id} {...section.content} alignment={section.structure} motion={section.motion} />;
    case "hero.object-study": return <ObjectStudyHero {...section} />;
    case "hero.vertical-record": return <VerticalRecordHero {...section} />;
    case "hero.front-page": return <FrontPageHero {...section} />;
    case "hero.open-circuit": return <OpenCircuitHero {...section} />;
    case "hero.between-acts": return <BetweenActsHero {...section} />;
    case "hero.assembly": return <AssemblyHero {...section} />;
    case "hero.comparison": return <ComparisonHero key={section.structure} {...section} />;
    case "content.feature-list": return <FeatureList id={section.id} {...section.content} layout={section.structure} motion={section.motion} />;
  }
  return assertNever(section);
}
function assertNever(value: never): never { throw new Error(`Missing section renderer: ${String(value)}`); }

export function CompositionPreview({ composition: input, fonts, iconPack, embedded = true }: {
  composition: PageComposition; fonts?: FontBindings; iconPack?: VigilIconPack; embedded?: boolean;
}) {
  const composition = assertComposition(input);
  const overlay = composition.sections.some(section => "placement" in section && section.placement === "overlay");
  const slot = (section: SectionInstance) => {
    const layers = resolveCreativeLayers(composition.site, composition.overrides, section.overrides);
    return <div className="de-composition-slot" key={`${section.id}-${section.component}-${section.structure}-${JSON.stringify(section.content)}`} data-section={section.component} data-section-id={section.id} data-hero-section={getSectionContract(section.component).category === "hero" ? "true" : undefined}>
      <DesignThemeProvider theme={composition.site.brand.theme} overrides={{ color: composition.site.brand.colors }} {...layers} fonts={fonts} className={getSectionContract(section.component).category === "navigation" ? "de-navigation-root" : ""}>
        {getSectionContract(section.component).category === "navigation" ? <div id={section.id}>{renderSection(section)}</div> : renderSection(section)}
      </DesignThemeProvider>
    </div>;
  };
  const navigation = composition.sections.filter(section => getSectionContract(section.component).category === "navigation");
  const footers = composition.sections.filter(section => getSectionContract(section.component).category === "footer");
  const body = composition.sections.filter(section => !["navigation","footer"].includes(getSectionContract(section.component).category));
  return <IconSystemProvider strokeWidth={composition.site.icons.strokeWidth} pack={iconPack}>
    <div id={composition.id} className={`de-composition ${overlay ? "de-composition--overlay" : ""}`} role={embedded ? "region" : undefined} aria-label={embedded ? composition.label : undefined}>
      <CompositionGeometry navigation={navigation[0]}>{navigation.map(section=><div className="de-navigation-region" key={section.id} data-sticky={"settings" in section && section.settings.scroll !== "static"}>{slot(section)}</div>)}
      {embedded ? <div className="de-composition-content">{body.map(section=><div key={section.id}>{slot(section)}{getSectionContract(section.component).category === "hero" && navigation[0]?.component === "navigation.threshold" ? <DesignThemeProvider theme={composition.site.brand.theme} overrides={{color:composition.site.brand.colors}} {...resolveCreativeLayers(composition.site,composition.overrides,navigation[0].overrides)}><ThresholdShelf section={navigation[0]}/></DesignThemeProvider> : null}</div>)}</div> : <main>{body.map(section=><div key={section.id}>{slot(section)}{getSectionContract(section.component).category === "hero" && navigation[0]?.component === "navigation.threshold" ? <DesignThemeProvider theme={composition.site.brand.theme} overrides={{color:composition.site.brand.colors}} {...resolveCreativeLayers(composition.site,composition.overrides,navigation[0].overrides)}><ThresholdShelf section={navigation[0]}/></DesignThemeProvider> : null}</div>)}</main>}
    {footers.map(slot)}</CompositionGeometry></div>
  </IconSystemProvider>;
}
