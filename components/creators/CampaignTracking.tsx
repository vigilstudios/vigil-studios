"use client";

import { useEffect, useRef } from "react";
import { track } from "@vercel/analytics";
import { captureCampaignAttribution } from "@/lib/campaign-attribution";

export function CampaignTracking({ campaign, event, confirmed = true, dedupeKey }: {
  campaign?: string; event?: string; confirmed?: boolean; dedupeKey?: string;
}) {
  const sent = useRef(false);
  useEffect(() => {
    const attribution = captureCampaignAttribution(campaign);
    if (!attribution || !event || !confirmed || sent.current) return;
    const key = dedupeKey ? `vigil:campaign-event:${event}:${dedupeKey}` : null;
    try { if (key && sessionStorage.getItem(key)) return; } catch { /* Private browsing */ }
    try {
      track(event, attribution);
      sent.current = true;
      if (key) sessionStorage.setItem(key, "1");
    } catch { /* No effect on checkout or the page when tracking is unavailable. */ }
  }, [campaign, event, confirmed, dedupeKey]);
  return null;
}
