import { Metadata } from "next";
import ClientOnboardingFlow from "@/components/portal/ClientOnboardingFlow";

export const metadata: Metadata = {
  title: "Onboarding | Client Portal | Vigil Studios",
  description:
    "Complete your website onboarding step by step inside your Vigil Studios client portal.",
};

export default function ClientOnboardingPage() {
  return <ClientOnboardingFlow />;
}