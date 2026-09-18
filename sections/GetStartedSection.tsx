import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CalendlyPopup } from "@/components/CalendlyModal";
import { EmailLink } from "@/components/site/Email";
import { HeroNotes } from "@/components/site/hero/HeroNotes";
import { WireMark } from "@/components/site/hero/WireMark";
import { GET_STARTED } from "@/lib/site-copy";

/**
 * The close, and the contact section: the hero's stage again. The star
 * grid, the turning wireframe mark, and good news popping up around the
 * viewport (uptime, ownership, response times) while three real next steps
 * wait in the middle. The section sticks to the viewport at the end of the
 * page, so the footer scrolls over it the way the page scrolled over the hero.
 */
export function GetStartedSection() {
  return (
    <section id="get-started" className="sticky top-0 z-0 isolate flex h-[100svh] flex-col overflow-hidden bg-[#0a0a0a] text-[#f5f5f3]">
      <div className="hero-grid absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_40%,rgba(10,10,10,0)_0%,rgba(10,10,10,0.55)_100%)]" aria-hidden />
      <WireMark className="absolute inset-0 block h-full w-full" story={false} size={{ desktop: 0.24, phone: 0.56 }} lift={{ desktop: 1.6, phone: 1.7 }} />
      <HeroNotes good items={GET_STARTED.notes} avoid={{ x: [18, 82], y: [50, 92] }} count={{ desktop: 5, phone: 3 }} />

      <div className="absolute inset-x-0 top-[57%] z-[5] px-6 text-center">
        <h2 className="mx-auto max-w-3xl font-[family-name:var(--font-space-grotesk)] text-[clamp(28px,3.4vw,48px)] font-medium leading-[1.06] tracking-[-0.02em] text-balance">{GET_STARTED.title}</h2>
        <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[rgba(245,245,243,0.55)]">{GET_STARTED.line}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Link href={GET_STARTED.primary.href} className="btn-primary h-10 !px-4 text-[13px] font-semibold sm:!px-[18px]">
            {GET_STARTED.primary.label} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
          <CalendlyPopup className="inline-flex h-10 items-center justify-center rounded-lg border border-[color:var(--accent)] px-4 text-[13px] font-semibold text-[color:var(--accent)] transition-colors hover:bg-[rgba(16,212,90,0.1)] sm:px-[18px]">
            {GET_STARTED.call}
          </CalendlyPopup>
          <EmailLink className="inline-flex h-10 items-center justify-center rounded-lg border border-[rgba(245,245,243,0.25)] px-4 text-[13px] font-semibold text-[#f5f5f3] transition-colors hover:bg-[rgba(255,255,255,0.08)] sm:px-[18px]" icon="mr-1.5 h-3.5 w-3.5" label={GET_STARTED.emailLabel} />
        </div>
        <p className="mt-6 text-xs text-[rgba(245,245,243,0.55)]">{GET_STARTED.note}</p>
      </div>
    </section>
  );
}
