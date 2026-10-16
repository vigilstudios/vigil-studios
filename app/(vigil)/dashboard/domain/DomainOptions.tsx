import Link from "next/link";
import { ArrowRight, Globe2, Link2 } from "lucide-react";

/** Each entry opens its own guide, so the two setup forms never compete. */
export function DomainOptions({ canFind, canSetUp, savedName }: { canFind: boolean; canSetUp: boolean; savedName?: string }) {
  const options = [
    { title: "Find your domain", description: savedName ? `Continue setting up ${savedName}, or search for a new name.` : "Search for a name and buy it through your own Vercel account.", href: "/dashboard/domain?flow=find", icon: Globe2, enabled: canFind },
    { title: "Already own one", description: "Use your existing web address. We’ll guide you through the setup.", href: "/dashboard/domain?flow=own", icon: Link2, enabled: canSetUp },
  ];
  return <nav aria-label="Domain setup options" className="grid w-full gap-4 sm:grid-cols-2">
    {options.map(({ title, description, href, icon: Icon, enabled }) => {
      const content = <>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--bg-surface-soft)] text-[color:var(--accent)]"><Icon className="h-5 w-5" aria-hidden="true" /></span>
        <span className="mt-5 flex items-center justify-between gap-3 text-base font-semibold">{title}<ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--accent)]" aria-hidden="true" /></span>
        <span className="mt-2 block text-sm leading-6 text-[color:var(--text-secondary)]">{description}</span>
        {!enabled ? <span className="mt-3 block text-xs text-[color:var(--text-secondary)]">{canSetUp ? "Domain search is temporarily unavailable." : "Your website setup is being prepared."}</span> : null}
      </>;
      const style = "block min-w-0 rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6 text-left break-words focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--accent)]";
      return enabled ? <Link key={title} href={href} className={`${style} hover:border-[color:var(--accent)]`} aria-label={title}>{content}</Link> : <div key={title} aria-disabled="true" className={`${style} opacity-60`}>{content}</div>;
    })}
  </nav>;
}
