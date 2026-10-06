"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { CREATOR_CAMPAIGN } from "@/lib/creator-campaign";
import { CampaignLink } from "./CampaignLink";

/** Shared across public marketing, sign-in and checkout; the authenticated workspaces keep their own chrome. */
export function PromoBanner({ fixed = false, publicOnly = false }: { fixed?: boolean; publicOnly?: boolean }) {
  const path = usePathname();
  const [paused, setPaused] = useState(false);
  const { promotion } = CREATOR_CAMPAIGN;
  if (!promotion.enabled || (publicOnly && (/^\/(admin|dashboard)(\/|$)/.test(path)))) return null;
  const message = <><span>For creators &amp; influencers</span><span aria-hidden="true">✦</span><strong>{promotion.percentOff}% off</strong><span>Express &amp; Professional builds</span><span aria-hidden="true">✦</span><span>Build fee only</span><ArrowUpRight size={13} aria-hidden="true" /></>;
  return <aside className={`creator-promo-banner ${fixed ? "creator-promo-fixed" : ""}`} aria-label="Creator promotion" data-paused={paused}>
    <CampaignLink href="/creators#creator-hero" activateCampaignOnClick={CREATOR_CAMPAIGN.id} event="creator_promotion_banner_click" placement="site_banner" className="creator-promo-link">
      <span className="sr-only">For creators and influencers: {promotion.percentOff}% off Express and Professional build fees. Explore the promotion.</span>
      <span className="creator-promo-track" aria-hidden="true">{[0, 1].map(group => <span key={group} className="creator-promo-group">{[0, 1, 2, 3].map(copy => <span key={copy} className="creator-promo-message">{message}</span>)}</span>)}</span>
      <span className="creator-promo-static" aria-hidden="true">Creators &amp; influencers: {promotion.percentOff}% off Express &amp; Professional build fees <ArrowUpRight size={12} /></span>
    </CampaignLink>
    <button type="button" className="creator-promo-pause" aria-label={paused ? "Resume promotion banner" : "Pause promotion banner"} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}</button>
  </aside>;
}
