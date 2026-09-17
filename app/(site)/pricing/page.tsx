import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Container, Section, SectionIntro } from "@/components/site/primitives";
import { PricingTabs, type PricingTab } from "@/components/site/PricingTabs";
import { Reveal } from "@/components/site/Reveal";
import { FAQSection } from "@/sections/FAQSection";
import { GetStartedSection } from "@/sections/GetStartedSection";
import { getPublicPricing } from "@/lib/vigil/queries/public-pricing";

export const metadata: Metadata = {
  title: "Pricing | Vigil Studios",
  description: "One payment for the build, then a Vigil plan that keeps your website online, updated and working for you. Monthly, annual or three years.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [{ plans, builds }, params] = await Promise.all([getPublicPricing(), searchParams]);
  const initialTab: PricingTab = params.tab === "subscriptions" ? "subscriptions" : "websites";
  return (
    <>
      {/* The whole price in one room: Websites (paid once) and Subscriptions (ongoing), one tab at a time. */}
      <Section id="pricing" fill className="md:py-20!">
        <Container>
          <Reveal>
            <SectionIntro align="center" eyebrow="Pricing" title="One payment to build. One plan to keep it running." />
          </Reveal>
          <Reveal delay={0.1} className="mt-8">
            <PricingTabs plans={plans} builds={builds} initialTab={initialTab} />
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-5 max-w-5xl text-center text-xs leading-5 text-[color:var(--text-secondary)]">
              Every Vigil website needs a plan; Basic is the floor. Prices in USD; annual and three-year plans are paid up front. Cancel any time; your site and domain stay yours.
            </p>
          </Reveal>
        </Container>
      </Section>

      <FAQSection />
      <GetStartedSection />
      <Footer />
    </>
  );
}
