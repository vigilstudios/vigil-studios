import 'server-only';
import type { DbClient } from '../types';
import type { DeploymentProvider } from '../providers/types';
import { getDeploymentProvider } from '../providers/registry';
import { domainProductionContext } from '../services/domain-production';
import { managedDomainConfigs } from '../services/domain';
import { findExternalId, providerEnum } from '../services/provider-links';
import { checkDnsRecords, withOwnershipRecord } from '../services/dns';

/**
 * Published snapshots must render during the final HTTPS check, before that
 * check can promote the website to live. This read-only exception requires
 * the same approval, exact production build, ownership, DNS, SSL and provider
 * association checks as launch. It never changes lifecycle or delivers drafts.
 * Live sites and explicit review previews retain their existing fast path.
 */
export async function publishedWebsiteDelivery(
  admin: DbClient,
  websiteId: string,
  review: boolean,
  module: 'content' | 'blog' = 'content',
  providerFactory: () => DeploymentProvider = getDeploymentProvider,
): Promise<'standard' | 'launch' | null> {
  const rpc = module === 'blog' ? 'website_blog_delivery' : 'website_content_delivery';
  const available = await admin.rpc(rpc, { p_website: websiteId, p_review: review });
  if (available.error) throw available.error;
  if (available.data) return 'standard';
  if (review) return null;

  // Retain database enforcement of active organization, hosting entitlement,
  // website lifecycle, project scope, and enabled Blog collection.
  const eligible = await admin.rpc(rpc, { p_website: websiteId, p_review: true });
  if (eligible.error) throw eligible.error;
  if (!eligible.data) return null;
  const { data: website, error } = await admin.from('websites').select('organization_id,status').eq('id', websiteId).maybeSingle();
  if (error) throw error;
  if (!website || website.status !== 'building') return null;
  const provider = providerFactory();
  const production = await domainProductionContext(admin, websiteId, website.organization_id, provider);
  if (!production) return null;
  const siteId = await findExternalId(admin, { provider: providerEnum(provider.name), resourceKind: 'site', entityType: 'website', entityId: websiteId });
  if (!siteId) return null;
  const domains = await admin.from('domains').select('hostname,kind,verification_token').eq('website_id', websiteId).eq('organization_id', website.organization_id).neq('status', 'released');
  if (domains.error) throw domains.error;
  if (!domains.data?.length) return null;

  const ready = await Promise.all(domains.data.map(async domain => {
    if (!domain.verification_token) return false;
    const plan = managedDomainConfigs(domain.hostname, domain.kind);
    const configs = await Promise.all(plan.map(item => provider.getDomainConfig(siteId, item.hostname)));
    if (!configs.every(config => config.verified && config.sslReady && !config.misconfigured && config.requiredRecords.some(record => ['A', 'AAAA', 'CNAME'].includes(record.type)))) return false;
    if (configs[0].servingSiteId !== siteId || configs[0].servingDeploymentId !== production.externalId) return false;
    const records = withOwnershipRecord(configs.flatMap(config => config.requiredRecords), domain.hostname, domain.verification_token);
    const checks = await checkDnsRecords(domain.hostname, records);
    return checks.length > 0 && checks.every(check => check.ok);
  }));
  return ready.every(Boolean) ? 'launch' : null;
}

export async function canDeliverPublishedWebsite(...args: Parameters<typeof publishedWebsiteDelivery>): Promise<boolean> {
  return Boolean(await publishedWebsiteDelivery(...args));
}
