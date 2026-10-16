import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { domainHandoffEnabled } from "@/lib/vigil/domain-commerce-config";
import { DomainJourney } from "@/components/vigil/DomainJourney";
import { loadDomainIntent } from "@/lib/vigil/services/domain-handoff";
import { createClient } from "@/lib/supabase/server";
import { Card, DefinitionList, PageHeader, StatusPill, inputClass, labelClass } from "@/components/vigil/ui";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { formatDate, formatRelative } from "@/lib/vigil/format";
import { describeDomainStatus } from "@/lib/vigil/lifecycle";
import { getOrgDomains, getOrgWebsites } from "@/lib/vigil/queries/dashboard";
import { getOnboardingProject } from "@/lib/vigil/queries/onboarding";
import { requiredRecords } from "@/lib/vigil/services/dns";
import { ConnectDomainForm } from "./ConnectDomainForm";
import { DomainGuidePanel } from "./DomainGuidePanel";
import { DomainOptions } from "./DomainOptions";

export const metadata: Metadata = { title: "Domain" };
type Params = { flow?: string; website?: string; domain?: string; new?: string };

export default async function DomainPage({ searchParams }: { searchParams: Promise<Params> }) {
  const ctx = await requireOrgContext("/dashboard/domain");
  const [params, domains, websites, onboarding] = await Promise.all([searchParams, getOrgDomains(ctx.organization.id), getOrgWebsites(ctx.organization.id), getOnboardingProject(ctx.organization.id)]);
  const canManage = ctx.role === "owner" || ctx.role === "manager" || ctx.isImpersonating;
  const canFind = domainHandoffEnabled() && websites.length > 0;
  const client = await createClient();
  const intents = await Promise.all(websites.map(async website => ({ website, intent: await loadDomainIntent(client, ctx.organization.id, website.id) })));
  const saved = intents.find(({ intent }) => intent && intent.phase !== "cancelled");
  const currentDomains = domains.filter(domain => domain.status !== "released");
  // Saved handoffs resume on return/Overview. Explicit navigation wins, and
  // query IDs can only select rows already loaded for this organization.
  const flow = params.flow === "choose" ? "choose" : params.flow === "find" || params.flow === "own" ? params.flow : saved ? "find" : currentDomains.length ? "own" : "choose";
  const selectedWebsite = params.website === "choose" ? null : intents.find(({ website }) => website.id === params.website) ?? saved ?? (intents.length === 1 ? intents[0] : null);
  const domain = currentDomains.find(domain => domain.id === params.domain) ?? currentDomains[0];
  const addNew = params.new === "1" || !domain;
  const canAdd = canManage && websites.length > 0 && !domains.some(domain => domain.status === "connected");
  const briefDomain = onboarding?.brief.domain;
  const reachable = (domain?.verification as { connection_reachable?: boolean } | null)?.connection_reachable ?? null;
  const launchReady = (domain?.verification as { launch_ready?: boolean } | null)?.launch_ready === true;
  const status = domain ? describeDomainStatus(domain.status, { dnsOk: domain.dns_ok, sslOk: domain.ssl_ok, reachable, launchReady }) : null;
  const linkedWebsite = websites.find(website => website.id === domain?.website_id);

  return <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center sm:min-h-[calc(100dvh-5.5rem)] lg:min-h-[calc(100dvh-6.5rem)]">
    <div className={`w-full ${flow === "choose" ? "max-w-4xl" : "max-w-3xl"}`}>
    <PageHeader title="Domain" description={flow === "choose" ? "How would you like to set up your web address?" : "Follow the steps to set up your web address."} />
    {flow === "choose" ? <DomainOptions canFind={canFind} canSetUp={websites.length > 0} savedName={saved?.intent?.hostname} /> : <>
      <Link href="/dashboard/domain?flow=choose" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"><ArrowLeft className="h-4 w-4" aria-hidden="true" />All domain options</Link>
      {flow === "find" ? <Card>
        {!canFind ? <p className="text-sm text-[color:var(--text-secondary)]">Domain search is unavailable right now. You can return to the options or contact Vigil for help.</p> : selectedWebsite ? <>
          {websites.length > 1 ? <p className="mb-4 text-sm text-[color:var(--text-secondary)]">{selectedWebsite.website.name} · <Link className="underline" href="/dashboard/domain?flow=find&website=choose">Change website</Link></p> : null}
          <DomainJourney key={selectedWebsite.website.id} websiteId={selectedWebsite.website.id} initial={selectedWebsite.intent} canManage={canManage && !ctx.isImpersonating} />
        </> : <>
          <h2 className="text-base font-semibold">Which website is this domain for?</h2>
          <form action="/dashboard/domain" className="mt-4 space-y-4">
            <input type="hidden" name="flow" value="find" />
            <label className={labelClass} htmlFor="domain-website">Website</label>
            <select id="domain-website" name="website" className={inputClass}>{websites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}</select>
            <button className="btn-primary min-h-11 text-sm" type="submit">Continue</button>
          </form>
        </>}
      </Card> : <Card>
        {addNew ? <>
          <h2 className="text-base font-semibold">Already own one</h2>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Step 1 of 3 · Enter your web address</p>
          {canAdd ? <ConnectDomainForm websites={websites.map(site => ({ id: site.id, name: site.name }))} /> : <p className="mt-4 text-sm text-[color:var(--text-secondary)]">{domain ? "Your domain is already connected. Contact Vigil if you need to change it." : "A customer owner or manager can add a domain once the website is ready."}</p>}
        </> : domain && status ? <>
          {currentDomains.length > 1 ? <nav aria-label="Your domains" className="mb-5 flex flex-wrap gap-3 text-sm">{currentDomains.map(item => <Link key={item.id} className="break-all underline aria-[current=page]:text-[color:var(--accent)]" aria-current={item.id === domain.id ? "page" : undefined} href={`/dashboard/domain?flow=own&domain=${item.id}`}>{item.hostname}</Link>)}</nav> : null}
          <ol aria-label="Domain setup steps" className="mb-5 grid grid-cols-3 gap-2 text-xs text-[color:var(--text-secondary)]">
            {["Your domain", "Setup guide", "Connection status"].map((label, i) => <li key={label} aria-current={i === (domain.status === "connected" || launchReady ? 2 : 1) ? "step" : undefined} className="border-t-2 border-[color:var(--border)] pt-2 aria-[current=step]:border-[color:var(--accent)] aria-[current=step]:text-[color:var(--text-primary)]">{i + 1}. {label}</li>)}
          </ol>
          {domain.status !== "connected" && domain.source === "customer_owned" ? <DomainGuidePanel key={`${domain.id}:${domain.updated_at}`} domain={{ domainId: domain.id, hostname: domain.hostname, status: domain.status, records: requiredRecords(domain.hostname, domain.verification, domain.verification_token), dnsOk: domain.dns_ok, sslOk: domain.ssl_ok, reachable, launchReady, statusReason: domain.status_reason, cutoverReady: (domain.verification as { source?: string } | null)?.source === "provider" || Boolean(linkedWebsite?.preview_url) }} initialRegistrar={briefDomain?.domainId === domain.id && briefDomain.registrar ? briefDomain.registrar : "other"} canManage={canManage} /> : <>
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="break-all text-lg font-semibold">{domain.hostname}</h2><StatusPill tone={status.tone}>{status.label}</StatusPill></div>
            {domain.status_reason || status.hint ? <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{domain.status_reason || status.hint}</p> : null}
          </>}
          <details className="mt-5 border-t border-[color:var(--border)] pt-4"><summary className="min-h-9 cursor-pointer text-sm text-[color:var(--text-secondary)]">Connection details</summary><DefinitionList items={[
            { label: "Owner", value: "You" },
            { label: "DNS", value: domain.dns_ok === null ? "Not checked yet" : domain.dns_ok ? "Correct" : "Needs changes" },
            { label: "SSL", value: domain.ssl_ok ? "Active" : "Pending" },
            { label: "Expires", value: domain.expires_at ? formatDate(domain.expires_at) : "Managed by your registrar" },
            { label: "Last checked", value: formatRelative(domain.last_checked_at) },
          ]} /></details>
          {canAdd ? <Link className="mt-4 inline-flex min-h-11 items-center text-sm underline" href="/dashboard/domain?flow=own&new=1">Use another domain</Link> : null}
        </> : null}
      </Card>}
    </>}
    </div>
  </div>;
}
