import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/sections/HeroSection";
import { ClientJourney } from "@/components/site/ClientJourney";
import { WorkspaceFeatures } from "@/components/site/WorkspaceFeatures";
import { StartSection } from "@/sections/StartSection";
import { WhyVigilSection } from "@/sections/WhyVigilSection";
import { FAQSection } from "@/sections/FAQSection";
import { GetStartedSection } from "@/sections/GetStartedSection";

export default function Home() {
  return (
    <>
      <section className="relative h-[100svh] overflow-hidden">
        <HeroSection />
      </section>
      <ClientJourney />
      <StartSection />
      <WorkspaceFeatures />
      <WhyVigilSection />
      <FAQSection />
      <GetStartedSection />
      <Footer />
    </>
  );
}
