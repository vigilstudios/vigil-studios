import { Footer } from "@/components/layout/Footer";
import { SnapSections } from "@/components/site/SnapSections";
import { HeroSection } from "@/sections/HeroSection";
import { PillarsSection } from "@/sections/PillarsSection";
import { HowItWorksSection } from "@/sections/HowItWorksSection";
import { StartSection } from "@/sections/StartSection";
import { WhyVigilSection } from "@/sections/WhyVigilSection";
import { PricingSection } from "@/sections/PricingSection";
import { FAQSection } from "@/sections/FAQSection";
import { GetStartedSection } from "@/sections/GetStartedSection";

export default function Home() {
  return (
    <>
      <SnapSections />
      <HeroSection />
      <PillarsSection />
      <HowItWorksSection />
      <StartSection />
      <WhyVigilSection />
      <PricingSection />
      <FAQSection />
      <GetStartedSection />
      <Footer />
    </>
  );
}
