import { Footer } from "@/components/layout/Footer";
import { SnapSections } from "@/components/site/SnapSections";
import { StoryStage } from "@/components/site/story/StoryStage";
import { HeroSection } from "@/sections/HeroSection";
import { HowItWorksSection } from "@/sections/HowItWorksSection";
import { StartSection } from "@/sections/StartSection";
import { WhyVigilSection } from "@/sections/WhyVigilSection";
import { FAQSection } from "@/sections/FAQSection";
import { GetStartedSection } from "@/sections/GetStartedSection";

export default function Home() {
  return (
    <>
      <SnapSections />
      {/* The first two acts share one pinned stage: the hero, then "How it works" typed onto the same screen. */}
      <StoryStage>
        <HeroSection />
        <HowItWorksSection />
      </StoryStage>
      <StartSection />
      <WhyVigilSection />
      <FAQSection />
      <GetStartedSection />
      <Footer />
    </>
  );
}
