import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CalendlyPopup } from "@/components/CalendlyModal";
import { HeroNotes } from "@/components/site/hero/HeroNotes";
import { HeroScrollHint } from "@/components/site/hero/HeroScrollHint";
import { HeroWords } from "@/components/site/hero/HeroWords";
import { WireMark } from "@/components/site/hero/WireMark";
import { HERO } from "@/lib/site-copy";

/**
 * The hero: the first act on the story's stage (see StoryStage). Black, a
 * grid of small Vigil stars, the V* in the middle as a slowly turning
 * wireframe, notifications around it that arrive as problems and leave
 * handled. The words type in; as the visitor scrolls they untype and the
 * mark unravels, and the second act takes over the same screen. The
 * corner brackets are the HUD language of the navigation. Below `md` the
 * hero is a normal sticky section and the next act scrolls over it.
 */
const corner = "pointer-events-none absolute z-[4] hidden h-[18px] w-[18px] border-[rgba(245,245,243,0.35)] md:block";

export function HeroSection() {
  return (
    <div className="hero-layer sticky top-0 isolate flex h-[100svh] flex-col overflow-hidden bg-[#0a0a0a] text-[#f5f5f3] md:absolute md:inset-0 md:h-full">
      <div className="hero-grid absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_45%,rgba(10,10,10,0)_0%,rgba(10,10,10,0.55)_100%)]" aria-hidden />
      <WireMark className="absolute inset-0 block h-full w-full" />
      <HeroNotes />

      <span className={`${corner} left-4 top-4 border-l border-t`} aria-hidden />
      <span className={`${corner} right-4 top-4 border-r border-t`} aria-hidden />
      <span className={`${corner} bottom-4 left-4 border-b border-l`} aria-hidden />
      <span className={`${corner} bottom-4 right-4 border-b border-r`} aria-hidden />

      <div className="absolute inset-x-0 top-[66%] z-[5] px-6 text-center md:top-[71%]">
        <HeroWords title={HERO.title} line={HERO.line}>
          <Link href={HERO.primary.href} className="btn-primary h-10 !px-4 text-[13px] font-semibold sm:!px-[18px]">
            {HERO.primary.label} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
          <CalendlyPopup className="inline-flex h-10 items-center justify-center rounded-lg border border-[color:var(--accent)] px-4 text-[13px] font-semibold text-[color:var(--accent)] transition-colors hover:bg-[rgba(16,212,90,0.1)] sm:px-[18px]">
            {HERO.secondary.label}
          </CalendlyPopup>
        </HeroWords>
      </div>

      <HeroScrollHint />
    </div>
  );
}
