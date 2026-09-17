type AttentionDomain = {
  status: string;
  website_id: string | null;
};

type AttentionWebsite = {
  id: string;
  preview_url: string | null;
  live_url: string | null;
};

const CUSTOMER_DOMAIN_ATTENTION_STATUSES = new Set(["pending", "verifying", "error", "expired"]);

/**
 * DNS becomes the customer's responsibility only after their linked website
 * has a real preview (or is already live). Recording a domain during intake
 * must not create an early task while the team is still preparing the site.
 */
export function customerDomainNeedsAttention(domains: AttentionDomain[], websites: AttentionWebsite[]): boolean {
  const previewableWebsiteIds = new Set(
    websites
      .filter((website) => Boolean(website.preview_url || website.live_url))
      .map((website) => website.id),
  );

  return domains.some(
    (domain) =>
      CUSTOMER_DOMAIN_ATTENTION_STATUSES.has(domain.status) &&
      Boolean(domain.website_id && previewableWebsiteIds.has(domain.website_id)),
  );
}
