import Link from 'next/link';
import { Activity, ArrowUpRight, BarChart3, FileCode2, Gauge, Search } from 'lucide-react';
import { Panel, StatusLine } from './widgets';
import { DownloadSiteButton } from './DownloadSiteButton';
import type { Deployment, Domain, Website } from '@/lib/vigil/types';
import { checkSummary, operationalChecks, releaseSummary } from '@/lib/vigil/site-observability';
import { formatRelative } from '@/lib/vigil/format';

/** Operations for each live website; all measurements are tenant-scoped database rows. */
export function WebsiteOperations({site,domain,deployments,canExport,canRequest}:{site:Website;domain:Domain|null;deployments:Pick<Deployment,'environment'|'status'|'created_at'|'finished_at'>[];canExport:boolean;canRequest:boolean}) {
 const checks=operationalChecks(site,domain), summary=checkSummary(checks), releases=releaseSummary(deployments);
 const lastPublish=deployments.find(d=>d.environment==='production'&&d.status==='ready');
 const exportable=site.export_eligible&&site.code_ownership==='customer_owned';
 const parts=[{label:'Passed',value:summary.passed,color:'var(--accent)'},{label:'Needs attention',value:summary.attention,color:'var(--status-bad)'},{label:'Not checked',value:summary.pending,color:'var(--status-neutral)'}];
 let offset=0;
 return <section className="space-y-4" aria-label={`${site.name} operations`}>
  <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[11px] uppercase tracking-widest text-[color:var(--accent)]">Website overview</p><h2 className="mt-1 text-lg font-semibold">{site.name}</h2></div><a href={site.live_url!} target="_blank" rel="noreferrer" className="btn-secondary gap-2 !px-3 !py-2 text-xs">Open live site<ArrowUpRight size={14}/></a></div>
  <div className="grid gap-4 lg:grid-cols-3">
   <Panel title="Health & security">
    <div className="flex flex-wrap items-center gap-5">
     <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" role="img" aria-label={`${summary.passed} of ${summary.total} operational checks passed, ${summary.attention} need attention, ${summary.pending} not checked`}><circle cx="60" cy="60" r="48" fill="none" stroke="var(--track)" strokeWidth="9"/>{parts.map(part=>{const length=part.value/summary.total*301.59;const current=offset;offset+=length;return part.value>0?<circle key={part.label} cx="60" cy="60" r="48" fill="none" stroke={part.color} strokeWidth="9" strokeDasharray={`${length} ${301.59-length}`} strokeDashoffset={-current}/>:null;})}</svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center"><strong className="text-2xl tracking-tight">{summary.passed}/{summary.total}</strong><span className="text-[10px] text-[color:var(--text-secondary)]">checks passed</span></div>
     </div>
     <ul className="flex-1 space-y-3">{checks.map(check=><li key={check.label}><StatusLine size="sm" label={check.label} tone={check.value===null?'neutral':check.value?'good':'bad'} hint={check.value===null?'Not checked':check.value?'Passed':'Needs attention'}/></li>)}</ul>
    </div>
    <p className="mt-4 text-[11px] leading-5 text-[color:var(--text-secondary)]">Availability {site.last_health_at?`checked ${formatRelative(site.last_health_at)}`:'has not been checked'}. SSL reflects the recorded domain certificate check.</p>
    <Link href="/dashboard/domain" className="mt-2 inline-block text-xs text-[color:var(--accent)]">Manage domain and certificate →</Link>
   </Panel>
   <Panel title="Release history">
    <div className="flex items-end justify-between"><div><p className="text-3xl font-semibold tracking-tight">{releases.ready}</p><p className="mt-1 text-xs text-[color:var(--text-secondary)]">successful production releases</p></div><Activity className="h-5 w-5 text-[color:var(--accent)]" aria-hidden/></div>
    {releases.total>0?<><div className="mt-6 flex h-4 overflow-hidden rounded-full bg-[color:var(--track)]" role="img" aria-label={`Recent production releases: ${releases.ready} ready, ${releases.error} failed, ${releases.pending} in progress or canceled`}>{[{label:'Ready',value:releases.ready,color:'var(--accent)'},{label:'Failed',value:releases.error,color:'var(--status-bad)'},{label:'Other',value:releases.pending,color:'var(--status-neutral)'}].map(part=><span key={part.label} style={{width:`${part.value/releases.total*100}%`,background:part.color}}/>)}</div><dl className="mt-4 grid grid-cols-3 text-xs">{[['Ready',releases.ready],['Failed',releases.error],['Other',releases.pending]].map(([label,value])=><div key={label}><dt className="text-[color:var(--text-secondary)]">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}</dl></>:<p className="mt-6 text-xs text-[color:var(--text-secondary)]">No production releases recorded yet.</p>}
    <p className="mt-4 text-[11px] text-[color:var(--text-secondary)]">{releases.total} production releases among the latest recorded deployments. </p>
   </Panel>
   <Panel title="Site code & tools">
    <FileCode2 className="mb-3 h-5 w-5 text-[color:var(--accent)]" aria-hidden/><p className="text-base font-semibold">{site.code_ownership==='customer_owned'?'Your website, your code':'Managed by Vigil'}</p><p className="mt-2 text-xs leading-5 text-[color:var(--text-secondary)]">{exportable?'Keep a copy of your website source whenever you need it.':'Source export is not included for this website.'}</p>
    <div className="mt-4 flex flex-wrap gap-2">{exportable&&(canExport?<DownloadSiteButton websiteId={site.id}/>:<p className="text-xs text-[color:var(--text-secondary)]">Owners and managers can download.</p>)}<Link href="/dashboard/requests" className="btn-secondary !px-3 !py-2 text-xs">{canRequest?'Request a change':'View change options'}</Link></div>
    <p className="mt-4 text-[11px] text-[color:var(--text-secondary)]">Last published: {lastPublish?formatRelative(lastPublish.finished_at??lastPublish.created_at):site.last_deployed_at?formatRelative(site.last_deployed_at):'Not recorded'}</p>
    <p className="mt-2 break-all text-[11px] text-[color:var(--text-secondary)]">{site.live_url}</p>
   </Panel>
  </div>
  <div className="grid gap-4 md:grid-cols-3">{[{title:'Traffic',icon:BarChart3,description:'Visitor totals, sources and trends will appear when website analytics is connected.'},{title:'Performance',icon:Gauge,description:'Speed and Core Web Vitals will appear when performance reporting is connected.'},{title:'SEO',icon:Search,description:'Search visibility and audit results will appear when SEO reporting is connected.'}].map(metric=><Panel title={metric.title} key={metric.title}><div className="flex items-center gap-3"><metric.icon className="h-5 w-5 text-[color:var(--text-secondary)]" aria-hidden/><p className="text-sm font-medium">Not connected</p></div><p className="mt-3 text-xs leading-5 text-[color:var(--text-secondary)]">{metric.description}</p></Panel>)}</div>
 </section>;
}
