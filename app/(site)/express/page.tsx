import type { Metadata } from "next";
import { getPublicPricing } from "@/lib/vigil/queries/public-pricing";
import { ExpressCatalogue } from "@/components/express/ExpressCatalogue";

const title = "Vigil Express | Vigil Studios";
const description =
  "Fixed-price single-page websites built from a template made for your industry. See the full example before you buy, and go live in one to two business days.";

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
