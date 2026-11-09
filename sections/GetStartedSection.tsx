import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CalendlyPopup } from "@/components/CalendlyModal";
import { EmailLink } from "@/components/site/Email";
import { Container, Section } from "@/components/site/primitives";
import { PACKAGE_FINDER_HREF } from "@/lib/vigil/package-finder";

export function GetStartedSection() {
  return (
    <Section id="get-started" alt className="scroll-mt-28 border-y border-[color:var(--border)]">
      <Container>
        <div className="flex flex-col items-start gap-7 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-primary)] p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[color:var(--accent)]">Your next step</p>
            <h2 className="mt-3 max-w-lg font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight sm:text-5xl">Tell us what you want your website to do.</h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-[color:var(--text-secondary)]">Find a package online or talk it through with the person who’ll help build it.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={PACKAGE_FINDER_HREF} className="btn-primary min-h-11 gap-2 text-sm">Find my website fit <ArrowRight size={15} aria-hidden /></Link>
            <CalendlyPopup className="btn-secondary min-h-11 text-sm">Book a call</CalendlyPopup>
            <EmailLink className="btn-secondary min-h-11 text-sm" icon="mr-2 h-4 w-4" label="Email us" />
          </div>
        </div>
      </Container>
    </Section>
  );
}
