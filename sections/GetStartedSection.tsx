import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { VelarisBackground } from "@/components/site/VelarisBackground";
import { Reveal } from "@/components/site/Reveal";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
import { CalendlyPopup } from "@/components/CalendlyModal";
import { GET_STARTED } from "@/lib/site-copy";

/**
 * The close, and the contact section: the same field as the hero, Virtue,
 * and three ways in. Whoever the reader is (a template, a Professional
 * site, something custom), each button is a real next step.
 */
export function GetStartedSection() {
  return (
    <section id="get-started" className="relative isolate flex flex-col justify-center overflow-hidden py-20 md:min-h-[100svh] md:py-24">
      <VelarisBackground className="absolute inset-0 -z-10 h-full w-full" grain={0.04} />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-[linear-gradient(to_bottom,var(--bg-section-alt),transparent)]" aria-hidden />
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 text-center sm:px-6">
        <Reveal className="flex flex-col items-center">
          <VirtueOrb size="lg" />
          <h2 className="mt-8 text-3xl font-semibold tracking-tight sm:text-5xl">{GET_STARTED.title}</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-[color:var(--text-primary)] opacity-80 sm:text-lg">{GET_STARTED.lead}</p>
        </Reveal>
        <Reveal delay={0.15} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href={GET_STARTED.primary.href} className="btn-primary min-h-12 !px-6 text-sm font-semibold">
            {GET_STARTED.primary.label} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <CalendlyPopup className="btn-secondary min-h-12 !px-6 text-sm font-medium">{GET_STARTED.call}</CalendlyPopup>
          <a href={`mailto:${GET_STARTED.email}`} className="btn-secondary min-h-12 !px-6 text-sm font-medium">
            <Mail className="mr-2 h-4 w-4" /> {GET_STARTED.emailLabel}
          </a>
        </Reveal>
        <Reveal delay={0.25}>
          <p className="mt-8 text-xs text-[color:var(--text-primary)] opacity-60">{GET_STARTED.note}</p>
        </Reveal>
      </div>
    </section>
  );
}
