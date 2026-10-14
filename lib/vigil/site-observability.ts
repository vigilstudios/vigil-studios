import type { Deployment, Domain, Website } from './types';
export type OperationalCheck = {label: string; value: boolean | null};
/** Recorded checks only. A live URL is not evidence of a healthy site or valid SSL. */
export function operationalChecks(site: Pick<Website,'health_ok'|'last_health_at'>, domain: Pick<Domain,'dns_ok'|'ssl_ok'> | null): OperationalCheck[] {
  return [
    {label:'Availability',value:site.last_health_at ? site.health_ok : null},
    {label:'DNS connection',value:domain?.dns_ok ?? null},
    {label:'SSL certificate',value:domain?.ssl_ok ?? null},
  ];
}
export function checkSummary(checks: OperationalCheck[]) {
  return {passed:checks.filter(c=>c.value===true).length,attention:checks.filter(c=>c.value===false).length,pending:checks.filter(c=>c.value===null).length,total:checks.length};
}
export function releaseSummary(deployments: Pick<Deployment,'environment'|'status'>[]) {
  const production=deployments.filter(d=>d.environment==='production');
  return {ready:production.filter(d=>d.status==='ready').length,error:production.filter(d=>d.status==='error').length,pending:production.filter(d=>!['ready','error'].includes(d.status)).length,total:production.length};
}
