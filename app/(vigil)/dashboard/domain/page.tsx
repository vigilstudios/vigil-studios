import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDomainLaunchProfile } from "@/lib/vigil/domain-engine/launch-profile";
import { hasLiveWebsitePolicy } from "@/lib/vigil/domain-engine/live-policy";
import { readDomainEngineConfig } from "@/lib/vigil/domain-engine/config";
import { AuthorizedExistingDomain } from "@/components/vigil/domain-engine/CloudflareDomainConnection";
import { DomainWorkspace } from "@/components/vigil/domain-engine/DomainWorkspace";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { domainHandoffEnabled } from "@/lib/vigil/domain-commerce-config";
import { DomainJourney } from "@/components/vigil/DomainJourney";
import { DomainPurchasePreview } from "@/components/vigil/DomainPurchasePreview";
import { AdminDomainControls } from "@/components/vigil/AdminDomainControls";
import { canManageDomainSetup } from "@/lib/vigil/domain-access";
import { loadDomainIntent } from "@/lib/vigil/services/domain-handoff";
import { createClient } from "@/lib/supabase/server";
import { Card, PageHeader, StatusPill, inputClass, labelClass } from "@/components/vigil/ui";
import { requireOrgContext } from "@/lib/vigil/auth/session";
import { describeDomainStatus } from "@/lib/vigil/lifecycle";
import { getOrgDomains, getOrgWebsites } from "@/lib/vigil/queries/dashboard";
import { getOnboardingProject } from "@/lib/vigil/queries/onboarding";
import { guidedDomainRecords } from "@/lib/vigil/services/dns";
import { normalizeHostname } from "@/lib/vigil/services/domain";
import { REGISTRAR_GUIDES } from "@/lib/vigil/domain-guides";
import type { RegistrarKey } from "@/lib/vigil/onboarding/brief";
import { ConnectDomainForm } from "./ConnectDomainForm";
import { DomainGuidePanel } from "./DomainGuidePanel";
import { DomainOptions } from "./DomainOptions";

export const metadata: Metadata = { title: "Domain" };
type Params = { flow?: string; website?: string; domain?: string; new?: string; hostname?: string; registrar?: string };

export default async function DomainPage({ searchParams }: { searchParams: Promise<Params> }) {
  const ctx = await requireOrgContext("/dashboard/domain");
  const [params, domains, websites, onboarding] = await Promise.all([searchParams, getOrgDomains(ctx.organization.id), getOrgWebsites(ctx.organization.id), getOnboardingProject(ctx.organization.id)]);
  const canManage = canManageDomainSetup(ctx);
  const adminManaging = ctx.staffRole === "admin";
  const liveConfigured=readDomainEngineConfig().enabled && process.env.VIGIL_DOMAIN_LIVE_ENABLED === "true";
  const approvedLiveWebsites = liveConfigured ? await Promise.all(websites.map(async site => await hasLiveWebsitePolicy(createAdminClient(), ctx.organization.id, site.id) ? site.id : null)) : [];
  const launchProfile = liveConfigured ? await getDomainLaunchProfile(createAdminClient()) : null;
  const liveDomains = approvedLiveWebsites.some(Boolean) || Boolean(launchProfile?.purchasing_enabled);
  const engineSurface = liveConfigured && Boolean(launchProfile);
  const canFind = (engineSurface || liveDomains || domainHandoffEnabled()) && websites.length > 0;
  const client = await createClient();
  const intents = await Promise.all(websites.map(async website => ({ website, intent: await loadDomainIntent(client, ctx.organization.id, website.id) })));
  const saved = intents.find(({ intent }) => intent && intent.phase !== "cancelled");
  const currentDomains = domains.filter(domain => domain.status !== "released");
  // Saved handoffs resume on return/Overview. Explicit navigation wins, and
  // query IDs can only select rows already loaded for this organization.
  const savedDomain = currentDomains.find(domain => intents.some(({ website, intent }) => intent && intent.phase !== "cancelled" && intent.hostname === domain.hostname && website.id === domain.website_id && (!params.website || params.website === website.id)));
  const selectedWebsite = params.website === "choose" ? null : intents.find(({ website }) => website.id === params.website) ?? saved ?? (intents.length === 1 ? intents[0] : null);
  const requestedName = normalizeHostname(params.hostname ?? "") ?? "";
  const validPreview = params.flow === "purchase-preview" && requestedName && websites.some(site => site.id === params.website);
  const flow = validPreview ? canManage ? currentDomains.some(item => item.hostname === requestedName && item.website_id === params.website) ? "own" : "find" : "purchase-preview" : params.flow === "choose" ? "choose" : params.flow === "find" || params.flow === "own" ? params.flow : savedDomain ? "own" : saved ? "find" : currentDomains.length ? "own" : "choose";
  const domain = currentDomains.find(domain => domain.id === params.domain) ?? currentDomains.find(domain => domain.hostname === requestedName && domain.website_id === selectedWebsite?.website.id) ?? savedDomain ?? currentDomains[0];
  const addNew = params.new === "1" || !domain || Boolean(requestedName && !currentDomains.some(item => item.hostname === requestedName));
  const canAdd = canManage && websites.length > 0 && !domains.some(domain => domain.status === "connected");
  const briefDomain = onboarding?.brief.domain;
  const reachable = (domain?.verification as { connection_reachable?: boolean } | null)?.connection_reachable ?? null;
  const launchReady = (domain?.verification as { launch_ready?: boolean } | null)?.launch_ready === true;
  const status = domain ? describeDomainStatus(domain.status, { dnsOk: domain.dns_ok, sslOk: domain.ssl_ok, reachable, launchReady }) : null;
  const initialRegistrar = (domain?.registrar && domain.registrar in REGISTRAR_GUIDES ? domain.registrar : briefDomain?.domainId === domain?.id && briefDomain?.registrar ? briefDomain.registrar : "other") as RegistrarKey;
  const afterPurchase = initialRegistrar === "vercel" && intents.some(({ website, intent }) => intent && intent.phase !== "cancelled" && intent.hostname === domain?.hostname && website.id === domain?.website_id);
  const adminWebsiteId = flow === "own" && !addNew && domain?.website_id ? domain.website_id : selectedWebsite?.website.id;

  return <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center sm:min-h-[calc(100dvh-5.5rem)] lg:min-h-[calc(100dvh-6.5rem)]">
    <div className={`w-full ${flow === "choose" ? "max-w-4xl" : "max-w-3xl"}`}>
    <PageHeader title="Domain" description={flow === "choose" ? "How would you like to set up your web address?" : "Follow the steps to set up your web address."} />
    {adminManaging ? <AdminDomainControls key={adminWebsiteId} customer={ctx.organization.name} selectedWebsite={adminWebsiteId} websites={intents.map(({ website, intent }) => {
      const setupDomains = currentDomains.filter(item => item.website_id === website.id);
      return { id: website.id, name: website.name, intentVersion: intent?.version ?? 0,
        canReset: ["provisioning", "building", "error"].includes(website.status) && !website.live_url && !website.primary_domain_id && setupDomains.every(item => item.source === "customer_owned" && item.status !== "connected" && (item.verification as { source?: string } | null)?.source !== "provider"),
        domains: setupDomains.map(item => ({ id: item.id, hostname: item.hostname, updated_at: item.updated_at })) };
    })} /> : null}
    {flow === "choose" ? <DomainOptions managedPurchasing={engineSurface || liveDomains} canFind={canFind} canSetUp={websites.length > 0} savedName={saved?.intent?.hostname} /> : <>
      <Link href="/dashboard/domain?flow=choose" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"><ArrowLeft className="h-4 w-4" aria-hidden="true" />All domain options</Link>
      {flow === "purchase-preview" ? <Card><DomainPurchasePreview hostname={requestedName} /></Card> : flow === "find" ? <Card>
        {!canFind ? <p className="text-sm text-[color:var(--text-secondary)]">Domain search is unavailable right now. You can return to the options or contact Vigil for help.</p> : selectedWebsite ? <>
          {websites.length > 1 ? <p className="mb-4 text-sm text-[color:var(--text-secondary)]">{selectedWebsite.website.name} · <Link className="underline" href="/dashboard/domain?flow=find&website=choose">Change website</Link></p> : null}
          {engineSurface || approvedLiveWebsites.includes(selectedWebsite.website.id) ? <DomainWorkspace discoveryOnly={(!launchProfile?.purchasing_enabled && !approvedLiveWebsites.includes(selectedWebsite.website.id)) || ctx.isImpersonating || ctx.role !== "owner"} key={selectedWebsite.website.id} live websiteId={selectedWebsite.website.id} initialHostname={requestedName} initialScreen="search" testWebsites={[{id:selectedWebsite.website.id,label:selectedWebsite.website.name}]} publishableTestKey={process.env.NEXT_PUBLIC_VIGIL_DOMAIN_STRIPE_LIVE_KEY??""} canManage={ctx.role === "owner" && !ctx.isImpersonating} /> : <DomainJourney key={`${selectedWebsite.website.id}:${requestedName}`} websiteId={selectedWebsite.website.id} initial={selectedWebsite.intent} initialHostname={requestedName} canManage={canManage} />}
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
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">We’ll guide you through one instruction at a time.</p>
          {canAdd ? <ConnectDomainForm websites={websites.map(site => ({ id: site.id, name: site.name }))} initialHostname={requestedName} initialWebsiteId={websites.find(site => site.id === params.website)?.id} registrar={params.registrar === "vercel" ? "vercel" : "other"} /> : <p className="mt-4 text-sm text-[color:var(--text-secondary)]">{domain ? "Your domain is already connected. Contact Vigil if you need to change it." : "A customer owner or manager can add a domain once the website is ready."}</p>}
        </> : domain && status ? <>
          {currentDomains.length > 1 ? <nav aria-label="Your domains" className="mb-5 flex flex-wrap gap-3 text-sm">{currentDomains.map(item => <Link key={item.id} className="break-all underline aria-[current=page]:text-[color:var(--accent)]" aria-current={item.id === domain.id ? "page" : undefined} href={`/dashboard/domain?flow=own&domain=${item.id}`}>{item.hostname}</Link>)}</nav> : null}
          {liveDomains && domain.managed_registration_id && domain.website_id ? <DomainWorkspace live websiteId={domain.website_id} initialScreen="progress" testWebsites={websites.map(site=>({id:site.id,label:site.name}))} publishableTestKey={process.env.NEXT_PUBLIC_VIGIL_DOMAIN_STRIPE_LIVE_KEY??""} canManage={ctx.role === "owner" && !ctx.isImpersonating} /> : domain.source === "customer_owned" ? (process.env.VIGIL_DOMAIN_CLOUDFLARE_ENABLED === "true" && ctx.role === "owner" && !ctx.isImpersonating ? <AuthorizedExistingDomain domainId={domain.id}><DomainGuidePanel key={`${domain.id}:${domain.updated_at}`} domain={{ domainId: domain.id, hostname: domain.hostname, status: domain.status, records: guidedDomainRecords(domain.hostname, domain.verification, domain.verification_token), dnsOk: domain.dns_ok, sslOk: domain.ssl_ok, reachable, launchReady, statusReason: domain.status_reason, cutoverReady: (domain.verification as { source?: string } | null)?.source === "provider" }} initialRegistrar={initialRegistrar} afterPurchase={afterPurchase} canManage={canManage} /></AuthorizedExistingDomain> : <DomainGuidePanel key={`${domain.id}:${domain.updated_at}`} domain={{ domainId: domain.id, hostname: domain.hostname, status: domain.status, records: guidedDomainRecords(domain.hostname, domain.verification, domain.verification_token), dnsOk: domain.dns_ok, sslOk: domain.ssl_ok, reachable, launchReady, statusReason: domain.status_reason, cutoverReady: (domain.verification as { source?: string } | null)?.source === "provider" }} initialRegistrar={initialRegistrar} afterPurchase={afterPurchase} canManage={canManage} />) : <>
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="break-all text-lg font-semibold">{domain.hostname}</h2><StatusPill tone={status.tone}>{status.label}</StatusPill></div>
            {domain.status_reason || status.hint ? <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{domain.status_reason || status.hint}</p> : null}
          </>}
          {canAdd ? <Link className="mt-4 inline-flex min-h-11 items-center text-sm underline" href="/dashboard/domain?flow=own&new=1">Use another domain</Link> : null}
        </> : null}
      </Card>}
    </>}
    </div>
  </div>;
}
