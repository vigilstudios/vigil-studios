import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Section, SectionIntro } from "@/components/site/primitives";
import { PricingTable } from "@/components/site/PricingTable";
import { formatMoney } from "@/lib/vigil/format";
import { getPublicPricing } from "@/lib/vigil/queries/public-pricing";

/** Home-page pricing: the two-part model in one breath, real numbers, link to the full page. */
export async function PricingSection() {
  const { plans, builds } = await getPublicPricing();
  const express = builds.find((b) => b.kind === "express");
  return (
    <Section id="pricing" fill>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <div>
            <SectionIntro eyebrow="Pricing" title="One payment to build. One plan to keep it running." lead={<>Vigil Express is {express?.amountCents != null ? formatMoney(express.amountCents, express.currency).replace(/\.00$/, "") : "a fixed price"} once. Then every Vigil website runs on a plan that pays for hosting, security, updates and the service level you choose. Sales tax is added at checkout.</>} />
            <Link href="/pricing" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[color:var(--accent)]">
              Full pricing, builds and what is included <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <PricingTable plans={plans} compact />
        </div>
      </Container>
    </Section>
  );
}
