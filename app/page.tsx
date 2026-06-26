import { Footer } from "@/components/layout/Footer";
import { AnimatedGridBackground } from "@/components/ui/AnimatedGridBackground";
import { HeroSection } from "@/sections/HeroSection";
import { ServicesSection } from "@/sections/ServicesSection";
import { PortfolioSection } from "@/sections/PortfolioSection";
import { ProcessSection } from "@/sections/ProcessSection";
import { WhyVigilSection } from "@/sections/WhyVigilSection";
import { PricingSection } from "@/sections/PricingSection";
import { FAQSection } from "@/sections/FAQSection";
import { ContactSection } from "@/sections/ContactSection";

export default function Home() {
  return (
    <>
      <AnimatedGridBackground />
      <HeroSection />
      <ServicesSection />
      <ProcessSection />
      <PricingSection />
      <WhyVigilSection />
      <PortfolioSection />
      <FAQSection />
      <ContactSection />
      <Footer />
    </>
  );
}
