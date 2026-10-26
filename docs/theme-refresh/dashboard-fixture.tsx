import { AppFrame } from "@/components/vigil/AppFrame";
import { AccountBlock } from "@/components/vigil/AccountBlock";
import { Panel, StatusLine, Checklist, Stepper, Timeline, Meter } from "@/components/vigil/widgets";
import { ButtonLink, StatusPill, inputClass, labelClass } from "@/components/vigil/ui";

/** Temporary visual QA fixture. Uses production dashboard components, fictional content. */
export default async function ThemePreview({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const admin = (await searchParams).mode === "admin";
  return <AppFrame homeHref="/theme-preview" initialCollapsed={false}
    groups={admin ? [{items:[
      {href:"/theme-preview",label:"Overview",icon:"overview",exact:true},
      {href:"/admin/orders",label:"Orders",icon:"billing"},
      {href:"/admin/organizations",label:"Customers",icon:"customers"},
      {href:"/admin/websites",label:"Websites",icon:"websites"},
      {href:"/admin/domains",label:"Domains",icon:"domains"},
      {href:"/admin/subscriptions",label:"Subscriptions",icon:"subscriptions"},
    ]},{label:"Operations",items:[
      {href:"/admin/jobs",label:"Jobs",icon:"jobs"},
      {href:"/admin/audit",label:"Audit log",icon:"audit"},
      {href:"/admin/plans",label:"Plans & staff",icon:"plans"},
    ]}] : [{items:[
      {href:"/theme-preview",label:"Overview",icon:"overview",exact:true},
      {href:"/dashboard/website",label:"Website",icon:"website"},
      {href:"/dashboard/files",label:"Files",icon:"files"},
      {href:"/dashboard/domain",label:"Domain",icon:"domain"},
      {href:"/dashboard/billing",label:"Subscription",icon:"billing"},
      {href:"/dashboard/requests",label:"Requests",icon:"requests"},
    ]},{label:"Grow",items:[
      {href:"/dashboard/leads",label:"Leads",icon:"leads",locked:true,badge:"Soon"},
      {href:"/dashboard/insights",label:"Insights",icon:"insights",locked:true,badge:"Soon"},
      {href:"/dashboard/virtue",label:"Virtue",icon:"virtue",locked:true,badge:"Soon"},
    ]},{items:[{href:"/dashboard/settings",label:"Settings",icon:"settings"}]}]}
    workspace={<span className="text-[13px] font-semibold">{admin ? "Vigil Admin" : "Marlow & Fen"}</span>}
    account={<AccountBlock name="Alex Morgan" email="alex@example.com" />}>
    <div className="space-y-4">
      <div><h1 className="text-lg font-semibold">{admin ? "Admin overview" : "Hello, Alex"}</h1><p className="mt-1 text-[13px] text-[color:var(--text-secondary)]">Here&apos;s where things stand with Marlow &amp; Fen.</p></div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Your website" action={<StatusPill tone="good">Live</StatusPill>}>
          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-4">
            <span className="text-[11px] text-[color:var(--text-secondary)]">marlowandfen.example</span>
            <h2 className="mt-4 text-xl font-semibold">Marlow &amp; Fen</h2>
            <p className="mt-1 text-[13px] text-[color:var(--text-secondary)]">Your website is live and looking good.</p>
            <div className="mt-5 flex flex-wrap gap-2"><ButtonLink href="/theme-preview">View website</ButtonLink><ButtonLink href="/theme-preview" variant="secondary">Manage website</ButtonLink></div>
          </div>
          <div className="mt-4"><Checklist items={[{label:"Website published",detail:"Last published today at 10:24 AM",tone:"good"},{label:"Security certificate active",detail:"Your visitors have a secure connection.",tone:"good"},{label:"Domain connected",detail:"marlowandfen.example",tone:"good"}]} /></div>
        </Panel>
        <div className="grid gap-4">
          <Panel title="Domain"><StatusLine tone="good" label="Connected" hint="marlowandfen.example" /><p className="mt-3 text-xs text-[color:var(--text-secondary)]">DNS and security are configured.</p></Panel>
          <Panel title="Subscription" action={<StatusPill tone="good">Active</StatusPill>}><h3 className="text-base font-semibold">Care plan</h3><p className="mt-1 text-xs text-[color:var(--text-secondary)]">Hosting, security, and help when you need it.</p><div className="mt-4"><Meter value={1} max={3} label={<><span>Requests this month</span><span>1 of 3</span></>} /></div></Panel>
          <Panel title="Requests" action={<StatusPill tone="info">In progress</StatusPill>}><p className="text-[13px] font-medium">Update the seasonal menu</p><p className="mt-1 text-xs text-[color:var(--text-secondary)]">The team is working on your latest changes.</p></Panel>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Project progress"><div className="py-2"><Stepper current={4} done steps={[{key:"details",label:"Your details"},{key:"build",label:"Building"},{key:"review",label:"Review"},{key:"launch",label:"Launch"}]} /></div><p className="mt-4 text-xs text-[color:var(--text-secondary)]">Your website is live. We&apos;ll keep things running from here.</p></Panel>
        <Panel title="Recent activity"><Timeline empty="No activity yet" items={[{key:"1",tone:"good",title:"Your website was published",meta:"All checks passed",when:"Today"},{key:"2",tone:"info",title:"Menu update requested",meta:"Request received by the team",when:"Yesterday"}]} /></Panel>
      </div>
      <Panel title="Request a change"><label className={labelClass} htmlFor="request-title">What would you like updated?</label><div className="flex flex-col gap-3 sm:flex-row"><input id="request-title" className={inputClass} placeholder="e.g. Add our new opening hours" /><button className="btn-primary shrink-0 text-sm" type="button">New request</button></div></Panel>
      <p className="text-[11px] text-[color:var(--text-secondary)]">Visual preview · fictional example data</p>
    </div>
  </AppFrame>;
}
