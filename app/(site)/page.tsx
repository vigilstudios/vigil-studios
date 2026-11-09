import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/sections/HeroSection";
import { SnapSections } from "@/components/site/SnapSections";
import { HowItWorksSection } from "@/sections/HowItWorksSection";
import styles from "@/sections/home-process.module.css";
import { StartSection } from "@/sections/StartSection";
import { WhyVigilSection } from "@/sections/WhyVigilSection";
import { FAQSection } from "@/sections/FAQSection";
import { GetStartedSection } from "@/sections/GetStartedSection";

export default function Home() {
  return (
    <>
      <SnapSections />
      <div className={styles.opening}>
        <div className={`hero-grid ${styles.grid}`} aria-hidden="true" />
        <section className="relative h-[100svh] overflow-hidden" data-home-snap>
          <HeroSection />
        </section>
        <HowItWorksSection />
      </div>
      <StartSection />
      <WhyVigilSection />
      <FAQSection />
      <GetStartedSection />
      <Footer />
    </>
  );
}
