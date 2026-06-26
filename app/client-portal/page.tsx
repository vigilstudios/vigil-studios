import { Metadata } from "next";
import { AnimatedGridBackground } from "@/components/ui/AnimatedGridBackground";
import PortalHero from "@/components/portal/PortalHero";
import PortalProgress from "@/components/portal/PortalProgress";
import ProjectTimeline from "@/components/portal/ProjectTimeline";
import ClientChecklist from "@/components/portal/ClientChecklist";
import BrandAssets from "@/components/portal/BrandAssets";
import ContentGuide from "@/components/portal/ContentGuide";
import DomainHosting from "@/components/portal/DomainHosting";
import Communication from "@/components/portal/Communication";
import BuildProgress from "@/components/portal/BuildProgress";
import PortalFAQ from "@/components/portal/PortalFAQ";
import LaunchSection from "@/components/portal/LaunchSection";

export const metadata: Metadata = {
  title: "Client Portal | Vigil Studios",
  description:
    "Your private onboarding portal for your Vigil Studios website project.",
};

export default function ClientPortalPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--bg-primary)] text-[color:var(--text-primary)]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <AnimatedGridBackground />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-28 sm:px-6 lg:px-8">
        <PortalHero />
        <PortalProgress />
        <ProjectTimeline />
        <ClientChecklist />

        <div className="grid gap-6 lg:grid-cols-2">
          <BrandAssets />
          <ContentGuide />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DomainHosting />
          <Communication />
        </div>

        <BuildProgress />
        <PortalFAQ />
        <LaunchSection />
      </div>
    </main>
  );
}