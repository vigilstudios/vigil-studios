import type { Metadata } from "next";
import { getPublicPricing } from "@/lib/vigil/queries/public-pricing";
import { ExpressCatalogue } from "@/components/express/ExpressCatalogue";

const title = "Vigil Express | Vigil Studios";
const description =
  "Polished single-page websites from curated industry designs, customized around your brand. Preview the design before purchase; first look within two business days of onboarding.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/express",
  },
  openGraph: {
    title,
    description,
    url: "/express",
    type: "website",
  },
};

export default async function ExpressPage() {
  const { builds } = await getPublicPricing();
  const build = builds.find((item) => item.kind === "express");
  return <ExpressCatalogue amountCents={build?.amountCents ?? null} currency={build?.currency ?? "usd"} />;
}
