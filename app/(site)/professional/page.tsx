import type { Metadata } from "next";
import { creatorBuildOffer } from "@/lib/creator-campaign";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/site/primitives";
import { getCheckoutCatalog } from "@/lib/vigil/queries/checkout";
import { ProfessionalWalkthrough } from "./ProfessionalWalkthrough";

export const metadata: Metadata = {
  title: "Start a Professional Site | Vigil Studios",
  description: "Explore a premium multi-page website tailored from Vigil’s design systems. See the scope, check your fit and start Professional online.",
  alternates: { canonical: "/professional" },
};

export default async function ProfessionalPage() {
  const catalog = await getCheckoutCatalog();
  const build = catalog.builds.find((item) => item.kind === "professional") ?? null;

  return (
    <>
      <Section className="pt-28 sm:pt-36">
        <Container>
          <ProfessionalWalkthrough amountCents={creatorBuildOffer("professional", build?.amount_cents ?? null).amountCents} currency={build?.currency ?? "usd"} checkoutAvailable={Boolean(build?.synced)} />
        </Container>
      </Section>
      <Footer />
    </>
  );
}
