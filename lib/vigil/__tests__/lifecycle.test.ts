import { describe, expect, it } from "vitest";
import { Constants } from "@/types/database.types";
import {
  assertTransition,
  canTransition,
  changeRequestTransitions,
  deploymentTransitions,
  describeDomainStatus,
  describeProjectStatus,
  describeSubscriptionStatus,
  describeWebsiteStatus,
  domainTransitions,
  isTerminal,
  jobTransitions,
  projectTransitions,
  subscriptionTransitions,
  websiteTransitions,
} from "../lifecycle";

const enums = Constants.public.Enums;

describe("lifecycle tables cover every database enum value", () => {
  const cases: [string, readonly string[], Record<string, readonly string[]>][] = [
    ["project_status", enums.project_status, projectTransitions],
    ["website_status", enums.website_status, websiteTransitions],
    ["domain_status", enums.domain_status, domainTransitions],
    ["subscription_status", enums.subscription_status, subscriptionTransitions],
    ["deployment_status", enums.deployment_status, deploymentTransitions],
    ["job_status", enums.job_status, jobTransitions],
    ["change_request_status", enums.change_request_status, changeRequestTransitions],
  ];

  it.each(cases)("%s", (_name, values, table) => {
    expect(Object.keys(table).sort()).toEqual([...values].sort());
    for (const targets of Object.values(table)) {
      for (const t of targets) expect(values).toContain(t);
    }
  });
});

describe("canTransition", () => {
  it("allows documented moves and refuses the rest", () => {
    expect(canTransition(websiteTransitions, "provisioning", "building")).toBe(true);
    expect(canTransition(websiteTransitions, "building", "live")).toBe(true);
    expect(canTransition(websiteTransitions, "live", "provisioning")).toBe(false);
    expect(canTransition(websiteTransitions, "archived", "live")).toBe(false);
    expect(canTransition(websiteTransitions, "live", "live")).toBe(false);
  });

  it("assertTransition throws with a readable message", () => {
    expect(() => assertTransition(domainTransitions, "released", "connected", "domain")).toThrow(
      'domain: cannot move from "released" to "connected".'
    );
    expect(() => assertTransition(domainTransitions, "pending", "verifying", "domain")).not.toThrow();
  });

  it("terminal states have no exits", () => {
    expect(isTerminal(projectTransitions, "closed")).toBe(true);
    expect(isTerminal(projectTransitions, "cancelled")).toBe(true);
    expect(isTerminal(projectTransitions, "draft")).toBe(false);
    expect(isTerminal(subscriptionTransitions, "canceled")).toBe(true);
  });
});

describe("customer-facing descriptions", () => {
  it("exist for every state and never mention a provider", () => {
    const words = /vercel|stripe|cloudflare|supabase|dns record|deployment id/i;
    for (const s of enums.website_status) {
      const d = describeWebsiteStatus(s);
      expect(d.label).toBeTruthy();
      expect(`${d.label} ${d.hint ?? ""}`).not.toMatch(words);
    }
    for (const s of enums.domain_status) expect(describeDomainStatus(s).label).toBeTruthy();
    for (const s of enums.subscription_status) expect(describeSubscriptionStatus(s).label).toBeTruthy();
    for (const s of enums.project_status) expect(describeProjectStatus(s).label).toBeTruthy();
  });

  it("uses the master architecture's outcome language", () => {
    expect(describeWebsiteStatus("live").label).toBe("Website Live");
    expect(describeDomainStatus("connected").label).toBe("Domain Connected");
    expect(describeDomainStatus("verifying", { dnsOk: true, sslOk: false, reachable: false }).label).toBe("Securing domain");
    expect(describeDomainStatus("verifying", { dnsOk: true, sslOk: false, reachable: false, launchReady: true }).label).toBe("Ready for launch");
    expect(describeDomainStatus("verifying", { dnsOk: true, sslOk: true, reachable: false }).label).toBe("Establishing connection");
    expect(describeSubscriptionStatus("active").label).toBe("Subscription Active");
  });
});
