import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VelarisBackground } from "@/components/site/VelarisBackground";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
import { CalendlyPopup } from "@/components/CalendlyModal";

/** The close: the same field as the hero, Virtue, two ways in. */
export function GetStartedSection() {
  return (
    <section id="get-started" className="relative isolate overflow-hidden py-24 sm:py-32">
      <VelarisBackground className="absolute inset-0 -z-10 h-full w-full" grain={0.04} />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-[linear-gradient(to_bottom,var(--bg-section-alt),transparent)]" aria-hidden />
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 text-center sm:px-6">
        <VirtueOrb size="lg" />
        <h2 className="mt-8 text-3xl font-semibold tracking-tight sm:text-5xl">Ready when you are.</h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-[color:var(--text-primary)] opacity-80 sm:text-lg">Pick a template and Virtue takes it from there. Prefer to talk first? Book fifteen minutes with a person.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/express" className="btn-primary min-h-12 !px-6 text-sm font-semibold">Choose a template <ArrowRight className="ml-2 h-4 w-4" /></Link>
          <CalendlyPopup className="btn-secondary min-h-12 !px-6 text-sm font-medium">Book a call</CalendlyPopup>
        </div>
      </div>
    </section>
  );
}
