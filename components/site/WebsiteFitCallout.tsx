import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import { CampaignLink } from "@/components/creators/CampaignLink";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
import { PACKAGE_FINDER_HREF, PACKAGE_FINDER_LABEL } from "@/lib/vigil/package-finder";

/** A shared guidance action below package choices, distinct from their direct links. */
export function WebsiteFitCallout({ className }: { className?: string }) {
  return (
    <div data-cursor="light" className={clsx("mt-7 flex flex-col items-center gap-5 rounded-2xl border border-[color:var(--accent)] bg-[color:var(--bg-primary)] p-6 text-center text-[color:var(--text-primary)] sm:flex-row sm:gap-6 sm:text-left", className)}>
      <VirtueOrb size="md" label="Virtue, your website guide" />
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--accent)]">Not sure which package to choose?</p>
        <h3 className="text-xl font-semibold tracking-tight">Let’s find the right fit for your business.</h3>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">Virtue helps you weigh your goals, timing and budget, then recommends what to build now and what can wait.</p>
      </div>
      <CampaignLink href={PACKAGE_FINDER_HREF} placement="website_package_guidance" className="btn-primary inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 !px-5 text-sm font-semibold sm:w-auto">
        {PACKAGE_FINDER_LABEL} <ArrowRight size={17} aria-hidden="true" />
      </CampaignLink>
    </div>
  );
}
