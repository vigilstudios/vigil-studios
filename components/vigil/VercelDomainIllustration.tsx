import { ArrowRight, Globe2 } from "lucide-react";

/** Code-native orientation graphic. Never an interactive provider control. */
export function VercelDomainIllustration({ hostname, stage }: { hostname: string; stage: "domains" | "domain" | "dns" }) {
  const active = "rounded-md border border-[color:var(--accent)] bg-[color:var(--accent-fill,var(--accent))]/10 px-3 py-2 font-medium text-[color:var(--text-primary)]";
  return <figure className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)]">
    <figcaption className="border-b border-[color:var(--border)] px-4 py-2 text-xs text-[color:var(--text-secondary)]">Vercel · simplified illustration</figcaption>
    <div aria-hidden="true" className="flex min-w-0 gap-3 p-4 text-xs sm:gap-5 sm:text-sm">
      <div className="w-24 shrink-0 space-y-2 sm:w-32">
        <p className="px-3 py-2 font-semibold">Your team</p>
        <p className="px-3 py-2 text-[color:var(--text-secondary)]">Overview</p>
        <p className={stage === "domains" ? active : "px-3 py-2"}>Domains</p>
      </div>
      <div className="min-w-0 flex-1 space-y-4 border-l border-[color:var(--border)] pl-3 sm:pl-5">
        <p className="break-all font-semibold">{stage === "domains" || stage === "domain" ? "Domains" : hostname}</p>
        {stage === "dns" ? <div className={active}>DNS Records</div> : <div className={`${stage === "domain" ? active : "rounded-md border border-[color:var(--border)] p-3"} flex min-w-0 items-center gap-2`}><Globe2 className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 break-all">{hostname}</span><ArrowRight className="h-4 w-4 shrink-0" /></div>}
      </div>
    </div>
    <p className="px-4 pb-3 text-xs text-[color:var(--text-secondary)]">Look for {stage === "domains" ? "Domains in the sidebar" : stage === "domain" ? "your domain in the list" : "DNS Records on your domain’s settings page"}. Vercel’s layout may vary.</p>
  </figure>;
}
