"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useHydrated } from "@/components/ui/useSiteTheme";
import { track } from "@vercel/analytics";
import { campaignHref, captureCampaignAttribution, readCampaignAttribution, campaignAttribution } from "@/lib/campaign-attribution";

/** Uses the public site's button classes; callers own label, destination and placement. */
export function CampaignLink({ href, children, className, event, placement, variant, campaign, activateCampaignOnClick }: {
  href: string; children: ReactNode; className?: string; event?: string; placement: string; campaign?: string; activateCampaignOnClick?: string; variant?: "primary" | "secondary";
}) {
  const hydrated = useHydrated();
  const prior = hydrated ? readCampaignAttribution() : null;
  const id = campaign ?? (hydrated ? new URLSearchParams(window.location.search).get("vigil_campaign") : null) ?? prior?.campaign;
  const attribution = hydrated && id ? { ...(prior?.campaign === id ? prior : {}), ...campaignAttribution(window.location.search, id) } : null;
  useEffect(() => { captureCampaignAttribution(campaign); }, [campaign]);
  const external = /^https:\/\//.test(href);
  return <Link href={campaignHref(href, attribution)} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}
    className={`${variant ? `btn-${variant} min-h-12 text-sm font-semibold` : ""} focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent)] ${className ?? ""}`}
    onClick={() => {
      const current = captureCampaignAttribution(campaign ?? activateCampaignOnClick) ?? readCampaignAttribution();
      if (event && current) {
        try { track(event, { ...current, placement }); } catch { /* Analytics must never block routing. */ }
      }
    }}>{children}</Link>;
}
