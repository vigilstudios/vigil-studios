import type { Metadata } from "next";
import { ArrowDown, ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { Container, Eyebrow, Panel, Section, SectionIntro } from "@/components/site/primitives";
import { Footer } from "@/components/layout/Footer";
import { CampaignLink } from "@/components/creators/CampaignLink";
import { CampaignTracking } from "@/components/creators/CampaignTracking";
import { CreatorHeroScene } from "@/components/creators/CreatorHeroScene";
import { CreatorMotion } from "@/components/creators/CreatorMotion";
import { CreatorSpotlightPreview } from "@/components/creators/CreatorSpotlightPreview";
import { HeroCollage } from "@/components/ui/modern-hero-section";
import { CREATOR_CAMPAIGN as campaign } from "@/lib/creator-campaign";
import { WEBSITE_TIERS } from "@/lib/vigil/site-tiers";
import { getPublicPricing } from "@/lib/vigil/queries/public-pricing";
import { formatMoney } from "@/lib/vigil/format";
import { EXPRESS_TEMPLATES } from "@/lib/constants";
import styles from "./creators.module.css";

const title = "Websites for Creators & Personal Brands | Vigil Studios";
const description = "Go beyond your link in bio. Explore Vigil Express and Professional websites for creators, influencers, artists and personal brands. Built for you, managed by Vigil.";
export const metadata: Metadata = {
  title, description, alternates: { canonical: "/creators" },
  keywords: ["creator website", "influencer website", "personal brand website", "artist portfolio", "Vigil Studios"],
  openGraph: { title, description, url: "/creators", type: "website", siteName: "Vigil Studios" },
  twitter: { card: "summary_large_image", title, description },
};

export default async function CreatorsPage() {
  const { builds, plans } = await getPublicPricing();
  const basic = plans.find((plan) => plan.code === "basic");
  const creatorTemplate = EXPRESS_TEMPLATES.find((template) => template.slug === "creator");
  return <div className={styles.page}>
    <CampaignTracking campaign={campaign.id} event="creator_campaign_visit" />
    <HeroCollage id="creator-hero" className={styles.hero} headingId="creator-title" titleClassName={styles.title} subtitleClassName={styles.heroLead}
      eyebrow={<div className={styles.heroEyebrow}><Eyebrow>Vigil Studios / For creators &amp; influencers</Eyebrow></div>}
      title={<>Your brand.<br /><em>Beyond the bio.</em></>}
      subtitle="A real home for your content, collaborations and everything you’re becoming."
      images={["creator-desk", "car", "beauty", "fitness", "food", "fashion", "music"].map(name => `/creators/collage/${name}.webp`)}
      imageSrcSets={["creator-desk", "car", "beauty", "fitness", "food", "fashion", "music"].map(name => `/creators/collage/${name}-300.webp 300w, /creators/collage/${name}-450.webp 450w, /creators/collage/${name}.webp 600w`)}
      imageAlts={["A creator’s candid digital-camera desk snapshot", "A charcoal sports coupe photographed at dusk", "Pink makeup and satin ribbons on a vanity", "Dumbbells, trainers and a blush exercise mat", "Pastries and iced matcha on a cafe table", "A pink handbag, ballet flats and outfit details", "Headphones and piano keys in a home studio"]}
      collageOverlay={<CreatorHeroScene />}
      footer={<CampaignLink campaign={campaign.id} {...campaign.actions.main} variant={undefined} placement="scroll" event="creator_campaign_cta_click" className={styles.scrollCue}><span>Scroll to find your fit</span><ArrowDown size={15} aria-hidden="true" /></CampaignLink>}
    >
      <CampaignLink campaign={campaign.id} {...campaign.actions.main} event="creator_campaign_cta_click" placement="hero" className="mt-5">{campaign.actions.main.label}<ArrowRight className="ml-2 h-4 w-4" /></CampaignLink>
    </HeroCollage>

    <Section id="choose-your-site" className={`${styles.anchor} !py-12 sm:!py-16`} alt><Container>
      <CreatorMotion><SectionIntro eyebrow={campaign.promotion.enabled ? `${campaign.promotion.percentOff}% off your build` : "Two ways to start"} title="Pick your starting point." align="center" /></CreatorMotion>
      <div className="mt-7 grid gap-5 md:grid-cols-2">{(["express", "professional"] as const).map((kind) => {
        const tier = WEBSITE_TIERS[kind];
        const build = builds.find((item) => item.kind === kind);
        const professional = kind === "professional";
        const action = campaign.actions[kind];
        return <CreatorMotion key={kind} className={styles.cardMotion} delay={professional ? .1 : 0}><Panel accent={professional ? "var(--accent)" : undefined} className={`${styles.priceCard} flex h-full flex-col`}>
          <p className={styles.kicker + " text-[color:var(--accent)]"}>{professional ? "Make it your own" : "A simple, faster start"}</p>
          <h3 className="mt-2 text-2xl font-semibold">{professional ? "Vigil Professional" : tier.name}</h3>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{professional ? "A tailored multi-page composition with room for every side of your brand." : "A polished single page from a curated industry design."}</p>
          <div className="mt-5 flex items-baseline gap-3">
            <p className={`${styles.priceAmount} text-4xl font-semibold tracking-tight`}>{build?.amountCents != null ? formatMoney(build.amountCents, build.currency).replace(/\.00$/, "") : "Price at next step"}</p>
            {build?.percentOff && build.originalAmountCents != null ? <del className="text-sm text-[color:var(--text-secondary)]">{formatMoney(build.originalAmountCents, build.currency).replace(/\.00$/, "")}</del> : null}
          </div>
          <p className="mt-1 text-xs text-[color:var(--text-secondary)]">One-time build + an ongoing Vigil plan</p>
          <ul className="my-5 space-y-2 text-sm text-[color:var(--text-secondary)]">{tier.included.slice(0, 2).map(feature => <li key={feature} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-[color:var(--accent)]" aria-hidden="true" />{feature}</li>)}<li className="flex gap-2"><Check size={15} className="shrink-0 text-[color:var(--accent)]" aria-hidden="true" />{tier.revisions} revision {tier.revisions === 1 ? "round" : "rounds"}</li></ul>
          {!professional && creatorTemplate?.status !== "available" ? <p className="mb-4 text-xs text-[color:var(--text-secondary)]">A dedicated creator design is coming soon.</p> : null}
          <CampaignLink campaign={campaign.id} {...action} placement="package" event={`creator_${kind}_cta_click`} className="mt-auto w-full">{action.label}<ArrowRight className="ml-2 h-4 w-4" /></CampaignLink>
        </Panel></CreatorMotion>;
      })}</div>
      <div className={styles.offerFootnote}>
        <p>{basic?.prices.month != null ? `Vigil plans from ${formatMoney(basic.prices.month, basic.currency)}/month.` : "Choose your ongoing plan at checkout."}{campaign.promotion.enabled ? " Promotion applies to the build fee only." : ""}</p>
        {campaign.promotion.enabled ? <details><summary>Offer details</summary><p>{campaign.promotion.terms}</p></details> : null}
      </div>
      <p className="mt-4 text-center text-sm leading-6 text-[color:var(--text-secondary)]">Need original components or a unique creative experience? <a href="/products/websites#custom" className="underline underline-offset-4">Explore bespoke Custom builds</a>; those projects are quoted separately and excluded from the creator offer.</p>
      <p className={styles.processLine}>Choose your site <span>→</span> Share your brand <span>→</span> Review <span>→</span> Launch</p>
    </Container></Section>

    <Section className={styles.spotlight} id="creator-spotlight"><Container>
      <CreatorMotion className={styles.spotlightHeading}>
          <Eyebrow>Creator spotlight</Eyebrow><h2 className="text-4xl sm:text-5xl">{campaign.showcase?.name ?? "Made for Scar."}</h2>
          <p className="mt-3 text-sm text-[color:var(--text-secondary)]">{campaign.showcase?.description ?? "A standalone bespoke project: original creative direction and interactions designed for Scar."}</p>
          {campaign.showcase?.siteUrl ? <CampaignLink campaign={campaign.id} href={campaign.showcase.siteUrl} variant="secondary" event="creator_showcase_click" placement="showcase" className="mt-5">Explore her site<ArrowUpRight className="ml-2 h-4 w-4" /></CampaignLink> : null}
      </CreatorMotion>
      <CreatorMotion delay={.08} className="mt-7">
        <CreatorSpotlightPreview image={campaign.showcase?.image ?? "/creators/scarlen-portfolio.webp"} imageAlt={campaign.showcase?.imageAlt ?? "Scarlen López’s pink New York creator portfolio"} video={campaign.showcase ? campaign.showcase.video : "/creators/scarlen-startup.mp4"} />
      </CreatorMotion>
      <CreatorMotion className={styles.spotlightActions} delay={.14}>
          <p className="mt-6 text-lg font-medium">Find the right fit for your brand.</p>
          <div className="mt-3 flex flex-col justify-center gap-3 sm:flex-row">{(["express", "professional"] as const).map(kind => <CampaignLink campaign={campaign.id} key={kind} {...campaign.actions[kind]} placement="final" event={`creator_${kind}_cta_click`}>{campaign.actions[kind].label}<ArrowRight className="ml-2 h-4 w-4" /></CampaignLink>)}</div>
      </CreatorMotion>
    </Container></Section>
    <CreatorMotion><Footer /></CreatorMotion>
  </div>;
}
