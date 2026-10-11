import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { getPublicPricing } from "@/lib/vigil/queries/public-pricing";
import { BILLING_PERIODS } from "@/lib/vigil/billing-periods";
import { PackageFinder } from "./PackageFinder";

export const metadata: Metadata = {
  title: "Find Your Website Fit | Vigil Studios",
  description: "A short guide to the website that fits your project: Express, Professional or Growth. Answer three questions and get your recommended next step.",
  alternates: { canonical: "/find-your-fit" },
};

export default async function FindYourFitPage({ searchParams }: { searchParams: Promise<{ plan?: string; period?: string }> }) {
  const [{ builds, plans }, params] = await Promise.all([getPublicPricing(), searchParams]);
  const plan = plans.find((item) => item.code === params.plan);
  const period = BILLING_PERIODS.find((item) => item.key === params.period);
  return <><PackageFinder builds={builds} preference={{ plan: plan?.code, period: period?.key }} selectedPlanName={plan?.name} /><Footer /></>;
}
