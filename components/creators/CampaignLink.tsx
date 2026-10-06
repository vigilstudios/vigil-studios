"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useHydrated } from "@/components/ui/useSiteTheme";
import { track } from "@vercel/analytics";
import { campaignHref, captureCampaignAttribution, readCampaignAttribution, campaignAttribution } from "@/lib/campaign-attribution";
import { creatorPromoHref } from "@/lib/creator-campaign";

type CampaignLinkProps = {
  href: string; children: ReactNode; className?: string; event?: string; placement: string; campaign?: string; activateCampaignOnClick?: string; variant?: "primary" | "secondary";
};

/** Keep public links prerendered while subscribing to the router's current query after hydration. */
export function CampaignLink(props: CampaignLinkProps) {
  return <Suspense fallback={<CampaignLinkContent {...props} search="" />}><CampaignLinkWithSearch {...props} /></Suspense>;
}

function CampaignLinkWithSearch(props: CampaignLinkProps) {
  const params = useSearchParams();
  return <CampaignLinkContent {...props} search={params?.toString() ?? ""} />;
}

/** Uses the public site's button classes; callers own label, destination and placement. */
function CampaignLinkContent({ href, children, className, event, placement, variant, campaign, activateCampaignOnClick, search }: CampaignLinkProps & { search: string }) {
  const hydrated = useHydrated();
  const prior = hydrated ? readCampaignAttribution() : null;
  const id = campaign ?? new URLSearchParams(search).get("vigil_campaign") ?? prior?.campaign;
  const attribution = hydrated && id ? { ...(prior?.campaign === id ? prior : {}), ...campaignAttribution(search, id) } : null;
  useEffect(() => { captureCampaignAttribution(campaign); }, [campaign]);
  const external = /^https:\/\//.test(href);
  const destination = creatorPromoHref(href, search, campaign);
  return <Link href={campaignHref(destination, attribution)} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}
    className={`${variant ? `btn-${variant} min-h-12 text-sm font-semibold` : ""} focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent)] ${className ?? ""}`}
    onClick={() => {
      const current = captureCampaignAttribution(campaign ?? activateCampaignOnClick) ?? readCampaignAttribution();
      if (event && current) {
        try { track(event, { ...current, placement }); } catch { /* Analytics must never block routing. */ }
      }
    }}>{children}</Link>;
}
