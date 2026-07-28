"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Globe2,
} from "lucide-react";
import { portalClient } from "./portalData";

type PortalHeroProps = {
  project?: {
    project_name?: string;
    package_name?: string;
    current_phase?: string;
    launch_window?: string | null;
    domain?: string | null;
    clients?: {
      company_name?: string;
      contact_name?: string;
      contact_email?: string;
    } | null;
  } | null;
};

export default function PortalHero({ project }: PortalHeroProps) {
  const displayName =
    project?.clients?.contact_name ||
    project?.clients?.company_name ||
    portalClient.name;
  const projectName = project?.project_name || portalClient.projectName;
  const packageName = project?.package_name || portalClient.packageName;
  const currentPhase = project?.current_phase || portalClient.currentPhase;
  const launchWindow = project?.launch_window || portalClient.launchWindow;
  const domain = project?.domain || "example.com";

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 shadow-[0_30px_120px_-60px_color-mix(in_srgb,var(--accent)_35%,transparent)] backdrop-blur-xl sm:rounded-[2.5rem] sm:p-10 lg:p-12">
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] blur-3xl" />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[color:var(--bg-surface-soft)] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_360px] lg:items-center xl:grid-cols-[minmax(0,1.35fr)_400px]"
      >
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-4 py-2 text-sm text-[color:var(--accent)]">
            <Sparkles className="h-4 w-4" />
            Private Client Portal
          </div>

          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-[color:var(--text-primary)] sm:text-5xl lg:text-6xl">
            Welcome aboard,{" "}
            <br />
            <span className="text-[color:var(--accent)]">
              {displayName}
            </span>
            .
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-[color:var(--text-secondary)] sm:text-lg">
            Your project is officially underway. This portal walks you through
            exactly what happens next, what we need from you, and how we’ll move
            your website from kickoff to launch.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="/client-portal/onboarding"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-[color:var(--bg-primary)] transition hover:bg-[color:var(--accent-hover)]"
            >
              Start onboarding
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>

            <a
              href="#project-roadmap"
              className="inline-flex items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--bg-surface)] px-6 py-3 text-sm font-semibold text-[color:var(--text-primary)] transition hover:bg-[color:var(--bg-surface-soft)]"
            >
              View roadmap
            </a>
          </div>
        </div>

        <div className="grid gap-4">
          <DomainCard domain={domain} />
          <CurrentPhaseCard
            currentPhase={currentPhase}
            projectName={projectName}
            packageName={packageName}
            launchWindow={launchWindow}
          />
        </div>
      </motion.div>
    </section>
  );
}

function DomainCard({ domain }: { domain: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-5 backdrop-blur-xl sm:rounded-[2rem] sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[color:var(--accent)]">
          <Globe2 className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm text-[color:var(--text-secondary)]">Domain</p>
          <a
            href={domain ? `https://${domain}` : "https://example.com"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-semibold text-[color:var(--accent)] transition hover:text-[color:var(--accent-hover)]"
          >
            {domain || "example.com"}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <p className="text-sm leading-6 text-[color:var(--text-secondary)]">
        Your connected website domain will appear here once setup is complete.
      </p>
    </div>
  );
}

function CurrentPhaseCard({
  currentPhase,
  projectName,
  packageName,
  launchWindow,
}: {
  currentPhase: string;
  projectName: string;
  packageName: string;
  launchWindow: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-5 sm:rounded-[2rem] sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[color:var(--accent)]">
          <CheckCircle2 className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm text-[color:var(--text-secondary)]">
            Current phase
          </p>
          <p className="font-semibold text-[color:var(--text-primary)]">
            {currentPhase}
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-[1.25rem] bg-[color:var(--bg-surface)] p-5">
        <InfoRow label="Project" value={projectName} />
        <InfoRow label="Package" value={packageName} />
        <InfoRow label="Launch Window" value={launchWindow} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[color:var(--border)] pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-[color:var(--text-secondary)]">
        {label}
      </span>
      <span className="text-right text-sm font-medium text-[color:var(--text-primary)]">
        {value}
      </span>
    </div>
  );
}