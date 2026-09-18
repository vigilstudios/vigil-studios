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

type KickoffRound = { project_id: string; status: string };
type KickoffWebsite = { project_id: string | null; status: string; preview_url: string | null; live_url: string | null; last_deployed_at: string | null };

/**
 * "Finished onboarding, ready for the team" is a one-time hand-off, not a
 * status. A project's status returns to in_progress every time the customer
 * answers a review round or asks for a revision, and that must not re-raise
 * the hand-off. The team has started once a review version has been
 * published (any round past pending) or the website has been built at all.
 */
export function projectAwaitingKickoff(
  projectId: string,
  rounds: KickoffRound[],
  websites: KickoffWebsite[],
): boolean {
  const reviewStarted = rounds.some((round) => round.project_id === projectId && round.status !== "pending");
  const siteStarted = websites.some(
    (website) =>
      website.project_id === projectId &&
      (Boolean(website.preview_url || website.live_url || website.last_deployed_at) || website.status !== "provisioning"),
  );
  return !reviewStarted && !siteStarted;
}
