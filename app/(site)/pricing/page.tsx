import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { BuildCards } from "@/components/site/BuildCards";
import { Container, Eyebrow, Section, SectionIntro } from "@/components/site/primitives";
import { PricingTable } from "@/components/site/PricingTable";
import { FAQSection } from "@/sections/FAQSection";
import { GetStartedSection } from "@/sections/GetStartedSection";
import { getPublicPricing } from "@/lib/vigil/queries/public-pricing";

export const metadata: Metadata = {
  title: "Pricing | Vigil Studios",
  description: "One payment for the build, then a Vigil plan that keeps your website online, updated and working for you. Monthly, annual or three years.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage() {
  const { plans, builds } = await getPublicPricing();
  return (
    <>
      <Section className="pt-32 sm:pt-40">
        <Container>
          <SectionIntro eyebrow="Pricing" title="Two parts. No surprises." lead="You pay once for the website, then a Vigil plan keeps it online, secure, updated and supported. Every Vigil-hosted site needs a plan; Basic is the floor." />
        </Container>
      </Section>

      <Section className="scroll-mt-28 pt-0" id="builds">
        <Container>
          <Eyebrow>1 · The build, paid once</Eyebrow>
          <BuildCards builds={builds} bullets={7} />
        </Container>
      </Section>

      <Section alt id="plans" className="scroll-mt-28">
        <Container>
          <div className="flex flex-col items-center text-center">
            <Eyebrow>2 · The Vigil plan, ongoing</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pick how much we take off your plate.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--text-secondary)]">Basic keeps the site online. Care means you never touch it. Growth and Priority add Virtue, who works your leads and reviews for you. Change plans any time.</p>
          </div>
          <div className="mt-10 flex flex-col items-center">
            <PricingTable plans={plans} bullets={6} />
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-5 text-[color:var(--text-secondary)]">
            Prices in USD. Annual and three-year plans are paid up front. Change-request allowances and Virtue usage limits are set per plan and shown in your dashboard. Cancel at any time; hosting ends at the close of the period and you keep your site and domain.
          </p>
        </Container>
      </Section>

      <FAQSection />
      <GetStartedSection />
      <Footer />
    </>
  );
}
