import { isIP } from "node:net";
import "server-only";

import { ProviderError } from "@/lib/vigil/auth/errors";
import { domainKind, relativeDnsName } from "@/lib/vigil/domains";
import type { DeploymentProvider, DeploymentSnapshot, DomainConfigSnapshot, ProvisionSiteInput } from "./types";

type VercelDeployment = {
  target?: string | null;
  id: string;
  readyState: string;
  url?: string | null;
  createdAt?: number;
  ready?: number;
  readyAt?: number;
  errorCode?: string | null;
  errorMessage?: string | null;
};

type VercelProjectDomain = {
  name: string;
  verified: boolean;
  verification?: { type: string; domain: string; value: string }[];
};

type VercelDnsRecommendations = { misconfigured?: boolean; recommendedCNAME?: {rank:number;value:string}[]; recommendedIPv4?:{rank:number;value:string[]}[] };

export class VercelDeploymentProvider implements DeploymentProvider {
  readonly name = "vercel" as const;

  constructor(
    private readonly token: string,
    private readonly teamId = process.env.VERCEL_TEAM_ID ?? "",
    private readonly request: typeof fetch = fetch
  ) {}

  async provisionSite(input: ProvisionSiteInput) {
    if (!input.repositoryFullName) throw new ProviderError("vercel", "Create the customer repository before provisioning Vercel.");
    let project = await this.api(`/v9/projects/${encodeURIComponent(input.name)}`, { allowNotFound: true }) as { id?: string; name?: string } | null;
    if (!project) {
      project = await this.api("/v11/projects", {
        method: "POST",
        body: {
          name: input.name,
          framework: null,
          rootDirectory: "site",
          gitRepository: { type: "github", repo: input.repositoryFullName },
        },
      }) as { id?: string; name?: string };
    }
    if (!project.id) throw new ProviderError("vercel", "Vercel returned an incomplete project.");
    // Customer review links must open for customers who are not members of
    // the Vigil Vercel team. New projects can inherit team-level Vercel
    // Authentication, so explicitly make each dedicated customer site public.
    // Preview deployment URLs remain unindexed by Vercel and are only shared
    // through the authenticated Vigil dashboard.
    await this.api(`/v9/projects/${encodeURIComponent(project.id)}`, {
      method: "PATCH",
      body: { ssoProtection: null },
    });
    return { externalId: project.id, previewUrl: project.name ? `https://${project.name}.vercel.app` : null };
  }

  async triggerDeployment(siteExternalId: string, input: { environment: "production" | "preview"; ref?: string; commitSha?:string; repositoryId?: number | null }) {
    if (!input.repositoryId) throw new ProviderError("vercel", "The GitHub repository id is missing from this website.");
    const deployment = await this.api("/v13/deployments", {
      method: "POST",
      query: { forceNew: "1", skipAutoDetectionConfirmation: "1" },
      body: {
        name: siteExternalId,
        project: siteExternalId,
        target: input.environment === "production" ? "production" : undefined,
        gitSource: { type: "github", repoId: input.repositoryId, ref: input.ref ?? "main",...(input.commitSha?{sha:input.commitSha}:{}) },
      },
    }) as VercelDeployment;
    return normalizeDeployment(deployment);
  }

  async getDeployment(externalId: string) {
    const deployment = await this.api(`/v13/deployments/${encodeURIComponent(externalId)}`, { allowNotFound: true }) as VercelDeployment | null;
    return deployment ? normalizeDeployment(deployment) : null;
  }

  async addDomain(
    siteExternalId: string,
    hostname: string,
    options: { redirect?: string; redirectStatusCode?: 301 | 302 | 307 | 308 } = {}
  ) {
    let domain: VercelProjectDomain;
    try {
      domain = await this.api(`/v10/projects/${encodeURIComponent(siteExternalId)}/domains`, {
        method: "POST",
        body: { name: hostname, ...options },
      }) as VercelProjectDomain;
    } catch (error) {
      // Adding a domain already attached to this project returns 400. Read it
      // back so retries remain idempotent; a genuine error still surfaces.
      const existing = await this.getProjectDomain(siteExternalId, hostname).catch(() => null);
      if (!existing) throw error;
      domain = existing;
    }
    // POST is idempotent only for a new domain. Re-apply redirect settings on
    // retries so an existing apex cannot silently lose its canonical redirect.
    if (options.redirect) {
      const updated = await this.api(`/v9/projects/${encodeURIComponent(siteExternalId)}/domains/${encodeURIComponent(hostname)}`, {
        method: "PATCH",
        body: options,
      }) as VercelProjectDomain;
      domain = { ...domain, ...updated, verification: updated.verification ?? domain.verification };
    }
    return this.domainSnapshot(domain);
  }

  async removeDomain(siteExternalId: string, hostname: string) {
    await this.api(`/v10/projects/${encodeURIComponent(siteExternalId)}/domains/${encodeURIComponent(hostname)}`, { method: "DELETE", allowNotFound: true });
  }

  async getDomainConfig(siteExternalId: string, hostname: string) {
    let domain = await this.getProjectDomain(siteExternalId, hostname);
    if (!domain.verified) {
      try {
        domain = await this.api(`/v9/projects/${encodeURIComponent(siteExternalId)}/domains/${encodeURIComponent(hostname)}/verify`, {
          method: "POST",
        }) as VercelProjectDomain;
      } catch (error) {
        // A 400 means the ownership/DNS challenge has not propagated yet.
        // Preserve its required record and let the durable verify job retry.
        if (!(error instanceof ProviderError) || error.status !== 400) throw error;
      }
    }
    const config = await this.api(`/v6/domains/${encodeURIComponent(hostname)}/config`, { allowNotFound: true, query: { projectIdOrName: siteExternalId } }) as { misconfigured?: boolean; recommendedCNAME?: { rank: number; value: string }[]; recommendedIPv4?: { rank: number; value: string[] }[] } | null;
    const snapshot = this.domainSnapshot(domain);
    const cname = config?.recommendedCNAME?.slice().sort((a,b) => Number(a.rank)-Number(b.rank)).find(item => typeof item.value === "string" && /^[a-z0-9.-]+\.?$/i.test(item.value))?.value;
    const ipv4 = config?.recommendedIPv4?.slice().sort((a,b) => Number(a.rank)-Number(b.rank)).flatMap(item => Array.isArray(item.value) ? item.value : []).find(value => typeof value === "string" && isIP(value) === 4);
    const routing = domainKind(hostname) === "subdomain" ? cname ? [{type:"CNAME" as const,name:relativeDnsName(hostname),value:cname}] : [] : ipv4 ? [{type:"A" as const,name:"@",value:ipv4}] : [];
    const alias = domain.verified && routing.length > 0 && config?.misconfigured === false
      ? await this.api(`/v4/aliases/${encodeURIComponent(hostname)}`, { query: { projectId: siteExternalId }, allowNotFound: true }) as { deploymentId?: string; projectId?: string } | null : null;
    return { ...snapshot, requiredRecords: [...snapshot.requiredRecords.filter(record => record.type === "TXT"), ...routing], misconfigured: config?.misconfigured ?? !domain.verified, sslReady: domain.verified && routing.length > 0 && config?.misconfigured === false,
      servingDeploymentId: alias?.deploymentId ?? null, servingSiteId: alias?.projectId ?? null };
  }

  async getRecommendedDnsRecords(siteExternalId:string,hostname:string){
    const config=await this.api(`/v6/domains/${encodeURIComponent(hostname)}/config`,{query:{projectIdOrName:siteExternalId}}) as VercelDnsRecommendations;
    const records=recommendedRoutingRecords(hostname,config);
    if(records.length===0)throw new ProviderError("vercel","Project-specific DNS recommendations are not available yet.",{retryable:true});
    return records;
  }

  async deleteSite(siteExternalId: string) {
    await this.api(`/v9/projects/${encodeURIComponent(siteExternalId)}`, { method: "DELETE", allowNotFound: true });
  }

  private async getProjectDomain(siteExternalId: string, hostname: string): Promise<VercelProjectDomain> {
    return this.api(`/v9/projects/${encodeURIComponent(siteExternalId)}/domains/${encodeURIComponent(hostname)}`) as Promise<VercelProjectDomain>;
  }

  private domainSnapshot(domain: VercelProjectDomain): DomainConfigSnapshot {
    const records: DomainConfigSnapshot["requiredRecords"] = [];
    for (const challenge of domain.verification ?? []) {
      if (["A", "AAAA", "CNAME", "TXT"].includes(challenge.type)) {
        records.push({ type: challenge.type as "A" | "AAAA" | "CNAME" | "TXT", name: challenge.domain, value: challenge.value });
      }
    }
    return { hostname: domain.name, requiredRecords: records, verified: domain.verified, misconfigured: !domain.verified, sslReady: false };
  }

  private async api(path: string, options: { method?: string; body?: unknown; query?: Record<string, string>; allowNotFound?: boolean } = {}): Promise<unknown | null> {
    const url = new URL(`https://api.vercel.com${path}`);
    if (this.teamId) url.searchParams.set("teamId", this.teamId);
    for (const [key, value] of Object.entries(options.query ?? {})) url.searchParams.set(key, value);
    let response: Response;
    try {
      response = await this.request(url, {
        method: options.method ?? "GET",
        headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    } catch (error) {
      throw new ProviderError("vercel", `Vercel request failed: ${error instanceof Error ? error.message : String(error)}`, { retryable: true });
    }
    if (options.allowNotFound && response.status === 404) return null;
    const payload = await response.json().catch(() => ({})) as { error?: { message?: string }; message?: string };
    if (!response.ok) {
      throw new ProviderError("vercel", payload.error?.message ?? payload.message ?? `Vercel returned ${response.status}.`, {
        retryable: response.status === 408 || response.status === 409 || response.status === 429 || response.status >= 500,
        status: response.status,
      });
    }
    return payload;
  }
}

function recommendedRoutingRecords(hostname:string,config:VercelDnsRecommendations):DomainConfigSnapshot["requiredRecords"]{
  if(domainKind(hostname)==="subdomain"){
    const cname=[...(config.recommendedCNAME??[])].sort((a,b)=>a.rank-b.rank)[0]?.value;
    return cname?[{type:"CNAME",name:relativeDnsName(hostname),value:cname}]:[];
  }
  const values=[...(config.recommendedIPv4??[])].sort((a,b)=>a.rank-b.rank)[0]?.value??[];
  return values.slice(0,1).map(value=>({type:"A" as const,name:"@",value}));
}

function normalizeDeployment(deployment: VercelDeployment): DeploymentSnapshot {
  if (!deployment?.id) throw new ProviderError("vercel", "Vercel returned an incomplete deployment.");
  const state = deployment.readyState?.toUpperCase();
  const status = state === "READY" ? "ready" : state === "ERROR" ? "error" : state === "CANCELED" ? "canceled" : state === "BUILDING" || state === "INITIALIZING" ? "building" : "queued";
  const createdAt = deployment.createdAt ? new Date(deployment.createdAt).toISOString() : null;
  const readyAtMs = deployment.readyAt ?? deployment.ready;
  return {
    environment: deployment.target === "production" ? "production" : "preview",
    externalId: deployment.id,
    status,
    url: deployment.url ? `https://${deployment.url.replace(/^https?:\/\//, "")}` : null,
    createdAt,
    readyAt: readyAtMs ? new Date(readyAtMs).toISOString() : null,
    error: status === "error" ? { code: deployment.errorCode ?? "deployment_error", message: deployment.errorMessage ?? "Vercel could not build this deployment." } : null,
  };
}
