import Link from "next/link";
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
      <Section id="pricing" className="pt-28 sm:pt-36">
        <Container>
          <Reveal>
            <SectionIntro heading="h1" align="center" eyebrow="Pricing" title="Pay once for the build. Pick a plan for what follows." lead="Your first payment includes your website build and the first billing period. You’ll see both before checkout." />
          </Reveal>
          <Reveal delay={0.1} className="mt-8">
            <PricingTabs plans={plans} builds={builds} initialTab={initialTab} />
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-5 max-w-5xl text-center text-xs leading-5 text-[color:var(--text-secondary)]">
              Basic covers managed hosting. Care and higher add website change requests and optional Bookings on compatible sites. Content Hub editing is available on eligible Professional and Growth sites with Care or higher. <Link href="/products/vigil#workspace" className="underline underline-offset-4">Explore the workspace.</Link> Prices are in USD. Annual and three-year plans are paid up front.
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
