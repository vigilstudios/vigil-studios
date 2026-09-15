import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/sections/HeroSection";
import { PillarsSection } from "@/sections/PillarsSection";
import { HowItWorksSection } from "@/sections/HowItWorksSection";
import { IndustriesSection } from "@/sections/IndustriesSection";
import { WhyVigilSection } from "@/sections/WhyVigilSection";
import { PricingSection } from "@/sections/PricingSection";
import { FAQSection } from "@/sections/FAQSection";
import { GetStartedSection } from "@/sections/GetStartedSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <PillarsSection />
      <HowItWorksSection />
      <IndustriesSection />
      <WhyVigilSection />
      <PricingSection />
      <FAQSection />
      <GetStartedSection />
      <Footer />
    </>
  );
}
