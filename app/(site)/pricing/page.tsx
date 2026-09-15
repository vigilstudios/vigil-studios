import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Chip, Container, Eyebrow, Section, SectionIntro } from "@/components/site/primitives";
import { PricingTable } from "@/components/site/PricingTable";
import { FAQSection } from "@/sections/FAQSection";
import { GetStartedSection } from "@/sections/GetStartedSection";
import { BUILD_COPY } from "@/lib/site-copy";
import { formatMoney } from "@/lib/vigil/format";
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
          <SectionIntro eyebrow="Pricing" title="Two parts. No surprises." lead="You pay once for the website, then a Vigil plan keeps it online, secure, updated and supported. Every Vigil-hosted site needs a plan; Basic is the floor. Sales tax is calculated at checkout." />
        </Container>
      </Section>

      <Section className="pt-0" id="builds">
        <Container>
          <Eyebrow>1 · The build, paid once</Eyebrow>
          <div className="grid gap-4 md:grid-cols-3">
            {builds.map((b) => {
              const copy = BUILD_COPY[b.kind];
              const tone = b.kind === "express" ? "accent" : b.kind === "professional" ? "teal" : "violet";
              return (
                <div key={b.kind} className="flex flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-xl font-semibold tracking-tight">{b.name}</h2>
                    <Chip tone={tone}>{b.kind === "express" ? "Fastest" : b.kind === "professional" ? "Multi-page" : "Scoped"}</Chip>
                  </div>
                  <p className="mt-1 text-sm text-[color:var(--text-secondary)]">{copy?.tagline ?? b.description}</p>
                  <p className="mt-5 text-3xl font-semibold tracking-tight">{b.amountCents != null ? formatMoney(b.amountCents, b.currency).replace(/\.00$/, "") : "Quoted"}<span className="text-sm font-normal text-[color:var(--text-secondary)]"> {b.amountCents != null ? "once" : "after a short call"}</span></p>
                  <ul className="mt-5 space-y-2 text-sm text-[color:var(--text-secondary)]">
                    {(copy?.bullets ?? []).map((x) => (
                      <li key={x} className="flex items-start gap-2"><Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" /> {x}</li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    {b.kind === "express" ? (
                      <Link href="/express" className="btn-primary inline-flex min-h-11 !px-4 !py-2 text-sm font-semibold">Choose a template <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                    ) : (
                      <Link href="/#contact" className="btn-secondary inline-flex min-h-11 !px-4 !py-2 text-sm">Talk to us</Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section alt id="plans">
        <Container>
          <div className="flex flex-col items-center text-center">
            <Eyebrow>2 · The Vigil plan, ongoing</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pick how much we take off your plate.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--text-secondary)]">Basic keeps the site online. Care means you never touch it. Growth and Priority add Virtue, who works your leads and reviews for you. Change plans any time.</p>
          </div>
          <div className="mt-10 flex flex-col items-center">
            <PricingTable plans={plans} />
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
