/** A small, bounded session record; no email, customer IDs, click IDs or arbitrary query data. */
export const CAMPAIGN_STORAGE_KEY = "vigil:creator-campaign:v1";
export const ATTRIBUTION_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"] as const;
export type CampaignAttribution = { campaign: string } & Partial<Record<(typeof ATTRIBUTION_KEYS)[number], string>>;

export function campaignAttribution(search: string, campaign: string): CampaignAttribution {
  const params = new URLSearchParams(search);
  const result: CampaignAttribution = { campaign };
  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key)?.trim().slice(0, 100);
    if (value) result[key] = value;
  }
  return result;
}

export function campaignHref(href: string, attribution: CampaignAttribution | null): string {
  // External projects retain their own attribution. Preserve existing route params/hash exactly.
  if (!attribution || !href.startsWith("/") || href.startsWith("//")) return href;
  const url = new URL(href, "https://www.vigilstudios.co");
  url.searchParams.set("vigil_campaign", attribution.campaign);
  for (const key of ATTRIBUTION_KEYS) if (attribution[key] && !url.searchParams.has(key)) url.searchParams.set(key, attribution[key]);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function readCampaignAttribution(): CampaignAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const record = JSON.parse(sessionStorage.getItem(CAMPAIGN_STORAGE_KEY) ?? "null");
    if (!record || typeof record.campaign !== "string") return null;
    return campaignAttribution(new URLSearchParams(record).toString(), record.campaign.slice(0, 100));
  } catch { return null; }
}

export function captureCampaignAttribution(campaign?: string): CampaignAttribution | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const id = campaign ?? params.get("vigil_campaign");
  const prior = readCampaignAttribution();
  if (!id) return prior;
  const next = { ...(prior?.campaign === id ? prior : {}), ...campaignAttribution(window.location.search, id.slice(0, 100)) };
  try { sessionStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(next)); } catch { /* Navigation still works with storage blocked. */ }
  return next;
}
