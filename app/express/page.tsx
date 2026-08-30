import type { Metadata } from "next";
import { ExpressCatalogue } from "@/components/express/ExpressCatalogue";

const title = "Express Sites | Vigil Studios";
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

export default function ExpressPage() {
  return <ExpressCatalogue />;
}
