import type { Metadata } from "next";
import { BILLING_PERIODS } from "@/lib/vigil/billing-periods";
import { getPublicPricing } from "@/lib/vigil/queries/public-pricing";
import { publishedExpressTemplates } from "@/lib/vigil/express/library";
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

export default async function ExpressPage({ searchParams }: { searchParams: Promise<{ plan?: string; period?: string }> }) {
  const preference = await searchParams;
  const [{ builds }, templates] = await Promise.all([getPublicPricing(), publishedExpressTemplates()]);
  const build = builds.find((item) => item.kind === "express");
  if (!templates.length) return <div className="container py-24"><h1 className="text-4xl">New designs are on the way.</h1><p className="mt-4">Check back soon for our Express catalog.</p></div>;
  return <ExpressCatalogue templates={templates} amountCents={build?.amountCents ?? null} currency={build?.currency ?? "usd"} preference={{ plan: preference.plan, period: BILLING_PERIODS.find((period) => period.key === preference.period)?.key }} />;
}
