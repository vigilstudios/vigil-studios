import type {
  ChangeRequestStatus,
  DeploymentStatus,
  DomainStatus,
  JobStatus,
  ProjectStatus,
  SubscriptionStatus,
  WebsiteStatus,
} from "./types";

/**
 * The single source of truth for allowed state transitions. The database
 * records every change (audit trigger); this module decides which changes
 * the application is willing to make. Keep the two in step with
 * docs/dashboard-v1/ARCHITECTURE.md §3.
 */
type Transitions<S extends string> = Readonly<Record<S, readonly S[]>>;

export const projectTransitions: Transitions<ProjectStatus> = {
  draft: ["intake", "cancelled"],
  intake: ["in_progress", "cancelled"],
  in_progress: ["review", "approved", "cancelled"],
  review: ["in_progress", "approved", "cancelled"],
  approved: ["launched", "in_progress", "cancelled"],
  launched: ["closed"],
  closed: [],
  cancelled: [],
};

export const websiteTransitions: Transitions<WebsiteStatus> = {
  provisioning: ["building", "error", "archived"],
  building: ["live", "error", "archived"],
  live: ["paused", "suspended", "building", "archived"],
  paused: ["live", "suspended", "archived"],
  suspended: ["live", "paused", "archived"],
  error: ["provisioning", "building", "archived"],
  archived: [],
};

export const domainTransitions: Transitions<DomainStatus> = {
  pending: ["verifying", "released"],
  verifying: ["connected", "error", "pending", "released"],
  connected: ["verifying", "expired", "released"],
  error: ["verifying", "pending", "released"],
  expired: ["verifying", "released"],
  released: [],
};

export const subscriptionTransitions: Transitions<SubscriptionStatus> = {
  incomplete: ["active", "trialing", "canceled"],
  trialing: ["active", "past_due", "canceled", "paused"],
  active: ["past_due", "unpaid", "canceled", "paused"],
  past_due: ["active", "unpaid", "canceled"],
  unpaid: ["active", "canceled"],
  paused: ["active", "canceled"],
  canceled: [],
};

export const deploymentTransitions: Transitions<DeploymentStatus> = {
  queued: ["building", "canceled", "error"],
  building: ["ready", "error", "canceled"],
  ready: [],
  error: [],
  canceled: [],
};

export const jobTransitions: Transitions<JobStatus> = {
  queued: ["running", "canceled"],
  running: ["succeeded", "failed", "queued"],
  failed: ["queued"],
  succeeded: [],
  canceled: [],
};

export const changeRequestTransitions: Transitions<ChangeRequestStatus> = {
  draft: ["submitted", "closed"],
  submitted: ["triaged", "draft", "declined", "closed"],
  triaged: ["in_progress", "declined", "closed"],
  in_progress: ["delivered", "triaged", "closed"],
  delivered: ["closed", "in_progress"],
  closed: [],
  declined: [],
};

export function canTransition<S extends string>(table: Transitions<S>, from: S, to: S): boolean {
  return from !== to && (table[from] ?? []).includes(to);
}

export function assertTransition<S extends string>(
  table: Transitions<S>,
  from: S,
  to: S,
  entity: string
): void {
  if (!canTransition(table, from, to)) {
    throw new Error(`${entity}: cannot move from "${from}" to "${to}".`);
  }
}

/** Terminal states have no outgoing transitions. */
export function isTerminal<S extends string>(table: Transitions<S>, state: S): boolean {
  return (table[state] ?? []).length === 0;
}

/**
 * Customer-facing wording. Provider details never leak through here; the
 * customer sees an outcome and, where useful, the next step.
 */
export type CustomerStatus = { label: string; tone: "neutral" | "good" | "warn" | "bad" | "info"; hint?: string };

export function describeWebsiteStatus(status: WebsiteStatus): CustomerStatus {
  switch (status) {
    case "live":
      return { label: "Website Live", tone: "good" };
    case "building":
      return { label: "Publishing changes", tone: "info", hint: "This usually takes a few minutes." };
    case "provisioning":
      return { label: "Setting up", tone: "info", hint: "We are preparing your hosting." };
    case "paused":
      return { label: "Paused", tone: "warn", hint: "Your website is not being served right now." };
    case "suspended":
      return { label: "Suspended", tone: "bad", hint: "Please check your subscription." };
    case "error":
      return { label: "Needs attention", tone: "bad", hint: "Our team has been notified." };
    case "archived":
      return { label: "Archived", tone: "neutral" };
  }
}

export function describeDomainStatus(
  status: DomainStatus,
  progress?: { dnsOk?: boolean | null; sslOk?: boolean | null; reachable?: boolean | null; launchReady?: boolean | null }
): CustomerStatus {
  switch (status) {
    case "connected":
      return { label: "Domain Connected", tone: "good" };
    case "verifying":
      if (!progress?.dnsOk) return { label: "Checking DNS", tone: "info", hint: "Changes can take up to 48 hours to propagate." };
      if (progress.launchReady) return { label: "Ready for launch", tone: "good", hint: "DNS is configured. Your domain will activate when Vigil publishes your website." };
      if (!progress.sslOk) return { label: "Securing domain", tone: "info", hint: "DNS is correct. The secure certificate is being issued." };
      if (!progress.reachable) return { label: "Establishing connection", tone: "info", hint: "The domain is configured. We are waiting for the website to become reachable." };
      return { label: "Final connection check", tone: "info", hint: "The domain will open as soon as the final check completes." };
    case "pending":
      return { label: "Waiting for setup", tone: "warn", hint: "Follow the connection steps to continue." };
    case "error":
      return { label: "Needs attention", tone: "bad" };
    case "expired":
      return { label: "Expired", tone: "bad", hint: "Renew the domain to keep your website reachable." };
    case "released":
      return { label: "Released", tone: "neutral" };
  }
}

export function describeSubscriptionStatus(status: SubscriptionStatus): CustomerStatus {
  switch (status) {
    case "active":
      return { label: "Subscription Active", tone: "good" };
    case "trialing":
      return { label: "Trial", tone: "info" };
    case "past_due":
      return { label: "Payment past due", tone: "warn", hint: "Update your payment method to avoid interruption." };
    case "unpaid":
      return { label: "Unpaid", tone: "bad" };
    case "paused":
      return { label: "Paused", tone: "warn" };
    case "incomplete":
      return { label: "Setup incomplete", tone: "warn" };
    case "canceled":
      return { label: "Canceled", tone: "neutral" };
  }
}

export function describeProjectStatus(status: ProjectStatus): CustomerStatus {
  switch (status) {
    case "draft":
      return { label: "Getting started", tone: "neutral" };
    case "intake":
      return { label: "Collecting your details", tone: "info" };
    case "in_progress":
      return { label: "In production", tone: "info" };
    case "review":
      return { label: "Ready for your review", tone: "warn" };
    case "approved":
      return { label: "Approved", tone: "good" };
    case "launched":
      return { label: "Launched", tone: "good" };
    case "closed":
      return { label: "Closed", tone: "neutral" };
    case "cancelled":
      return { label: "Cancelled", tone: "neutral" };
  }
}
