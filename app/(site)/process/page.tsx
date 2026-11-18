import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { ProcessJourney } from "@/components/site/ProcessJourney";
import { GetStartedSection } from "@/sections/GetStartedSection";

export const metadata: Metadata = {
  title: "How it works | Vigil Studios",
  description: "From your first website to a connected business: explore how Vigil builds, launches, and supports your customers, bookings, products, and next chapter.",
  alternates: { canonical: "/process" },
};

export default function ProcessPage() {
  return <><ProcessJourney /><GetStartedSection /><Footer /></>;
}
