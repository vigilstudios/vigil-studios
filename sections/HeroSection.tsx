import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CalendlyPopup } from "@/components/CalendlyModal";
import { HeroNotes } from "@/components/site/hero/HeroNotes";
import { WireMark } from "@/components/site/hero/WireMark";
import { HERO } from "@/lib/site-copy";

/**
 * The hero: black, a grid of small Vigil stars, the V* in the middle as a
 * slowly turning wireframe, and notifications around it that arrive as
 * problems and leave handled. The words sit under the mark; the mark and
 * the notes lean with the pointer. The corner brackets and the mono labels
 * are the same HUD language as the navigation.
 */
const corner = "pointer-events-none absolute z-[4] h-[18px] w-[18px] border-[rgba(245,245,243,0.35)]";

export function HeroSection() {
  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#0a0a0a] text-[#f5f5f3]">
      <div className="hero-grid absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_45%,rgba(10,10,10,0)_0%,rgba(10,10,10,0.55)_100%)]" aria-hidden />
      <WireMark className="absolute inset-0 block h-full w-full" />
      <HeroNotes />

      <span className={`${corner} left-4 top-4 border-l border-t`} aria-hidden />
      <span className={`${corner} right-4 top-4 border-r border-t`} aria-hidden />
      <span className={`${corner} bottom-4 left-4 border-b border-l`} aria-hidden />
      <span className={`${corner} bottom-4 right-4 border-b border-r`} aria-hidden />

      <div className="absolute inset-x-0 top-[66%] z-[5] px-6 text-center md:top-[71%]">
        <h1 className="hero-rise mx-auto max-w-4xl font-[family-name:var(--font-space-grotesk)] text-[clamp(26px,3.1vw,44px)] font-medium leading-[1.08] tracking-[-0.02em] text-balance">
          {HERO.title}
        </h1>
        <p className="hero-rise mt-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[rgba(245,245,243,0.55)] [animation-delay:120ms]">{HERO.line}</p>
        <div className="hero-rise mt-5 flex flex-row items-center justify-center gap-2.5 [animation-delay:240ms]">
          <Link href={HERO.primary.href} className="btn-primary h-10 !px-4 text-[13px] font-semibold sm:!px-[18px]">
            {HERO.primary.label} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
          <CalendlyPopup className="inline-flex h-10 items-center justify-center rounded-lg border border-[color:var(--accent)] px-4 text-[13px] font-semibold text-[color:var(--accent)] transition-colors hover:bg-[rgba(16,212,90,0.1)] sm:px-[18px]">
            {HERO.secondary.label}
          </CalendlyPopup>
        </div>
      </div>

      <p className="hero-bob absolute bottom-[22px] left-1/2 z-[5] -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(245,245,243,0.55)]" aria-hidden>
        Scroll ↓
      </p>
    </section>
  );
}
