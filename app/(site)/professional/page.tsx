import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Container, Section } from "@/components/site/primitives";
import { getCheckoutCatalog } from "@/lib/vigil/queries/checkout";
import { ProfessionalWalkthrough } from "./ProfessionalWalkthrough";

export const metadata: Metadata = {
  title: "Start a Professional Site | Vigil Studios",
  description: "See exactly what a Vigil Professional Site includes, check that it fits, and purchase your custom website online.",
  alternates: { canonical: "/professional" },
};

export default async function ProfessionalPage() {
  const catalog = await getCheckoutCatalog();
  const build = catalog.builds.find((item) => item.kind === "professional") ?? null;

  return (
    <>
      <Section className="pt-28 sm:pt-36">
        <Container>
          <ProfessionalWalkthrough amountCents={build?.amount_cents ?? null} currency={build?.currency ?? "usd"} checkoutAvailable={Boolean(build?.synced)} />
        </Container>
      </Section>
      <Footer />
    </>
  );
}
