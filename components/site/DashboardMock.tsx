"use client";

import "@/components/vigil/vigil.css";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import { ArrowUpRight, BarChart3, ClipboardList, CreditCard, Globe, Inbox, LayoutDashboard, MonitorSmartphone, Monitor, PanelLeftClose, Settings, Smartphone } from "lucide-react";
import { Checklist, Meter, Panel, StatusLine, Stepper, Timeline } from "@/components/vigil/widgets";
import { Logo } from "@/components/vigil/Logo";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";

/**
 * The customer dashboard's Overview, rendered with the product's own
 * widgets rather than a screenshot, so it is sharp at any size and follows
 * the site theme. The tenant is the demo restaurant from the catalogue in a
 * healthy, live state. Purely decorative: one image to assistive tech.
 */
const WIDTH = 1120;
const HEIGHT = 640;

const NAV: { label: string; icon: React.ComponentType<{ className?: string }>; active?: boolean; badge?: string }[][] = [
  [
    { label: "Overview", icon: LayoutDashboard, active: true },
    { label: "Website", icon: MonitorSmartphone },
    { label: "Domain", icon: Globe },
    { label: "Subscription", icon: CreditCard },
    { label: "Requests", icon: ClipboardList },
  ],
  [
    { label: "Leads", icon: Inbox, badge: "Soon" },
    { label: "Insights", icon: BarChart3, badge: "Soon" },
    { label: "Virtue", icon: ({ className }) => <VirtueOrb size="xs" label="" className={className} />, badge: "Soon" },
  ],
  [{ label: "Settings", icon: Settings }],
];

export function DashboardMock({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / WIDTH)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={host} className={clsx("relative w-full overflow-hidden", className)} style={{ height: HEIGHT * scale }} role="img" aria-label="The Vigil dashboard: a customer's website, domain, subscription and project, each with a plain status.">
      <div className="vigil-frame absolute left-0 top-0 grid origin-top-left bg-[color:var(--bg-primary)] text-[color:var(--text-primary)]" style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})`, gridTemplateColumns: "224px minmax(0, 1fr)" }} aria-hidden>
        {/* Sidebar */}
        <aside className="flex flex-col border-r border-[color:var(--border)] bg-[color:var(--bg-secondary)]/60 px-3 py-3">
          <div className="flex items-center gap-2 px-1">
            <Logo size="sm" />
            <span className="text-[13px] font-semibold">Marlow &amp; Fen</span>
          </div>
          <nav className="mt-5 flex flex-1 flex-col gap-4">
            {NAV.map((group, gi) => (
              <div key={gi}>
                {gi === 1 ? <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">Grow</p> : null}
                <ul className="flex flex-col gap-0.5">
                  {group.map(({ label, icon: Icon, active, badge }) => (
                    <li key={label}>
                      <span className={clsx("flex h-9 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium", active ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[color:var(--accent)]" : "text-[color:var(--text-secondary)]")}>
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{label}</span>
                        {badge ? <span className="rounded-full bg-[color:var(--bg-surface-soft)] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">{badge}</span> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="flex items-center gap-2 px-1 py-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[11px] font-semibold uppercase text-[color:var(--accent)]">M</span>
            <span className="truncate text-xs font-medium">Owner, Marlow &amp; Fen</span>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-col">
          <div className="flex h-11 items-center gap-3 border-b border-[color:var(--border)] px-4 text-[13px]">
            <PanelLeftClose className="h-4 w-4 text-[color:var(--text-secondary)]" />
            <span className="font-medium">Overview</span>
          </div>
          <div className="space-y-4 p-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">Marlow &amp; Fen</p>
              <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
              <p className="mt-0.5 text-xs text-[color:var(--text-secondary)]">Everything Vigil is running for your business, at a glance.</p>
            </div>

            <div className="grid grid-cols-12 gap-4">
              <Panel className="col-span-5 row-span-2" title="Website" action={<span className="text-xs text-[color:var(--text-secondary)]">Details</span>}>
                <div className="overflow-hidden rounded-lg border border-[color:var(--border)]">
                  <div className="flex items-center gap-2 border-b border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] px-2 py-1">
                    <span className="mx-auto rounded bg-[color:var(--bg-primary)]/60 px-2 py-px font-mono text-[10px] text-[color:var(--text-secondary)]">marlowandfen.com</span>
                    <Monitor className="h-3 w-3 text-[color:var(--text-primary)]" />
                    <Smartphone className="h-3 w-3 text-[color:var(--text-secondary)]" />
                  </div>
                  <div className="relative aspect-[16/10]">
                    <Image src="/express-templates/previews/restaurant.jpg" alt="" fill sizes="480px" className="object-cover object-top" />
                  </div>
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <StatusLine tone="good" label="Website Live" hint="Published and monitored by Vigil." />
                  <span className="btn-secondary !px-2.5 !py-1 shrink-0 text-xs">Open site <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <dt className="text-[color:var(--text-secondary)]">Address</dt>
                    <dd className="truncate font-medium">marlowandfen.com</dd>
                  </div>
                  <div>
                    <dt className="text-[color:var(--text-secondary)]">Last published</dt>
                    <dd className="font-medium">2 days ago</dd>
                  </div>
                </dl>
              </Panel>

              <Panel className="col-span-4" title="Domain" action={<span className="text-xs text-[color:var(--text-secondary)]">Manage</span>}>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">marlowandfen.com</p>
                  <p className="text-xs text-[color:var(--text-secondary)]">Owned by you</p>
                  <div className="mt-2">
                    <StatusLine tone="good" label="Domain Connected" size="sm" />
                  </div>
                </div>
                <div className="mt-4">
                  <Checklist items={[{ label: "A record at your registrar", detail: "@ → Vigil", tone: "good" }, { label: "DNS pointing at Vigil", tone: "good" }, { label: "SSL certificate", tone: "good" }]} />
                </div>
                <p className="mt-3 text-[11px] text-[color:var(--text-secondary)]">Renews with your registrar. Last checked 2 hours ago.</p>
              </Panel>

              <Panel className="col-span-3" title="Subscription" action={<span className="text-xs text-[color:var(--text-secondary)]">Billing</span>}>
                <div className="flex h-full flex-col gap-4">
                  <div>
                    <p className="text-base font-semibold">Vigil Care</p>
                    <p className="text-xs text-[color:var(--text-secondary)]">Take care of my website</p>
                  </div>
                  <StatusLine tone="good" label="Subscription Active" size="sm" />
                  <Meter value={12} max={30} label={<><span>Renews on the 14th</span><span>18 days</span></>} srLabel="Billing period" />
                  <ul className="mt-auto grid grid-cols-2 gap-1 text-[11px]">
                    <li>✓ Hosting</li>
                    <li>✓ Domain</li>
                    <li>✓ Updates</li>
                    <li className="text-[color:var(--text-secondary)] line-through decoration-[color:var(--border)]">– Virtue</li>
                  </ul>
                </div>
              </Panel>

              <Panel className="col-span-7" title="Your project">
                <div className="flex items-center gap-8">
                  <div className="w-52 min-w-0">
                    <p className="truncate text-base font-semibold">Marlow &amp; Fen website</p>
                    <div className="mt-1">
                      <StatusLine tone="good" label="Live" size="sm" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Stepper steps={[{ key: "kickoff", label: "Kick-off" }, { key: "details", label: "Your details" }, { key: "build", label: "Build" }, { key: "review", label: "Your review" }, { key: "approved", label: "Approved" }, { key: "live", label: "Live" }]} current={5} done />
                  </div>
                </div>
              </Panel>
            </div>

            <Panel title="Recent activity">
              <Timeline
                items={[
                  { key: "1", tone: "good", title: "Website published", meta: "New spring menu photos, as requested", when: "2 d ago" },
                  { key: "2", tone: "good", title: "Request completed", meta: "Update opening hours for the bank holiday", when: "5 d ago" },
                  { key: "3", tone: "info", title: "SSL certificate renewed", when: "2 w ago" },
                ]}
                empty=""
              />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
