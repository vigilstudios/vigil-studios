import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/sections/HeroSection";
import { SnapSections } from "@/components/site/SnapSections";
import { HowItWorksSection } from "@/sections/HowItWorksSection";
import { StartSection } from "@/sections/StartSection";
import { WhyVigilSection } from "@/sections/WhyVigilSection";
import { FAQSection } from "@/sections/FAQSection";
import { GetStartedSection } from "@/sections/GetStartedSection";

export default function Home() {
  return (
    <>
      <SnapSections />
      <HowItWorksSection hero={<HeroSection />} />
      <StartSection />
      <WhyVigilSection />
      <FAQSection />
      <GetStartedSection />
      <Footer />
    </>
  );
}
