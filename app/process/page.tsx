import type { Metadata } from "next";
import { ProcessRoadmap } from "@/components/process/ProcessRoadmap";

const title = "Our Process | Vigil Studios";
const description =
  "A clear step-by-step roadmap for how Vigil Studios takes your website from strategy to launch.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/process",
  },
  openGraph: {
    title,
    description,
    url: "/process",
    type: "website",
  },
};

export default function ProcessPage() {
  return <ProcessRoadmap />;
}