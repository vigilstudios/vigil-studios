import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Section, SectionIntro } from "@/components/site/primitives";
import { PricingTabs } from "@/components/site/PricingTabs";
import { Reveal } from "@/components/site/Reveal";
import { getPublicPricing } from "@/lib/vigil/queries/public-pricing";

/** Home-page pricing: the two parts as two tabs, real numbers, link to the full page. */
export async function PricingSection() {
  const { plans, builds } = await getPublicPricing();
  return (
    <Section id="pricing" fill>
      <Container>
        <Reveal>
          <SectionIntro align="center" eyebrow="Pricing" title="One payment to build. One plan to keep it running." />
        </Reveal>
        <Reveal delay={0.1} className="mt-8">
          <PricingTabs plans={plans} builds={builds} />
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-8 text-center text-xs text-[color:var(--text-secondary)]">
            Every Vigil website needs a plan; Basic is the floor. Sales tax is added at checkout.{" "}
            <Link href="/pricing" className="inline-flex items-center gap-1 font-medium text-[color:var(--accent)]">
              Full pricing and what is included <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}
