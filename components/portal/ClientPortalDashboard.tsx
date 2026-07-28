"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText, UploadCloud } from "lucide-react";

import { AnimatedGridBackground } from "@/components/ui/AnimatedGridBackground";
import PortalHero from "@/components/portal/PortalHero";
import ProjectTimeline from "@/components/portal/ProjectTimeline";

export type ProjectWithClient = {
  id: string;
  project_name: string;
  package_name: string;
  current_phase: string;
  launch_window: string | null;
  next_step_title: string;
  next_step_description: string;
  domain: string | null;
  live_url: string | null;
  hosting_provider: string | null;
  clients: {
    company_name: string;
    contact_name: string;
    contact_email: string;
  } | null;
  project_phase_progress: {
    phase: string;
    progress: number;
  }[];
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

const viewport = { once: true, margin: "-80px" };

export default function ClientPortalDashboard({
  project,
}: {
  project: ProjectWithClient;
}) {
  const phases = project.project_phase_progress
    .map((phase) => ({
      label: formatPhaseLabel(phase.phase),
      progress: phase.progress,
    }))
    .sort((a, b) => {
      const order = ["Onboarding", "Design", "Development", "Review", "Launch"];
      return order.indexOf(a.label) - order.indexOf(b.label);
    });

  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--bg-primary)] text-[color:var(--text-primary)]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <AnimatedGridBackground />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.55 }}
          className="mb-6 sm:mb-8"
        >
          <PortalHero project={project} />
        </motion.div>

        <div className="space-y-6">
          <NextStepCard project={project} />

          <PhaseProgress phases={phases} />

          <div className="grid gap-4 md:grid-cols-2">
            <AssetCard />
            <DocumentsCard />
          </div>

          <ProjectTimeline />
        </div>
      </div>
    </main>
  );
}

function NextStepCard({ project }: { project: ProjectWithClient }) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      transition={{ duration: 0.55 }}
      viewport={viewport}
      className="rounded-[1.5rem] border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] p-5 shadow-[0_24px_90px_-60px_color-mix(in_srgb,var(--accent)_55%,transparent)] backdrop-blur-xl sm:rounded-[2rem] sm:p-8"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
        Your Next Step
      </p>

      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {project.next_step_title}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--text-secondary)] sm:text-base">
            {project.next_step_description}
          </p>
        </div>

        <Link
          href="/client-portal/onboarding"
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-[color:var(--bg-primary)] transition hover:bg-[color:var(--accent-hover)] sm:w-auto"
        >
          Onboarding
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.section>
  );
}

function PhaseProgress({
  phases,
}: {
  phases: { label: string; progress: number }[];
}) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      transition={{ duration: 0.55 }}
      viewport={viewport}
      className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 backdrop-blur-xl sm:rounded-[2rem] sm:p-8"
    >
      <div className="mb-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
          Website Progress
        </p>

        <h2 className="text-2xl font-semibold tracking-tight">
          Project phase overview
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {phases.map((phase) => (
          <CircularProgressCard key={phase.label} {...phase} />
        ))}
      </div>
    </motion.section>
  );
}

function CircularProgressCard({
  label,
  progress,
}: {
  label: string;
  progress: number;
}) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-4 text-center">
      <div className="relative mx-auto h-24 w-24">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-[color:var(--border)]"
          />
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            viewport={viewport}
            className="text-[color:var(--accent)]"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
          {progress}%
        </div>
      </div>

      <p className="mt-3 text-sm font-medium">{label}</p>
    </div>
  );
}

function AssetCard() {
  return (
    <DashboardActionCard
      icon={<UploadCloud className="h-5 w-5" />}
      title="Brand Assets"
      description="View uploaded logos, colors, fonts, and upload more if needed."
      href="/client-portal/assets"
      label="View assets"
    />
  );
}

function DocumentsCard() {
  return (
    <DashboardActionCard
      icon={<FileText className="h-5 w-5" />}
      title="Project Documents"
      description="Access contracts, proposals, invoices, and project documents."
      href="/client-portal/documents"
      label="View documents"
    />
  );
}

function DashboardActionCard({
  icon,
  title,
  description,
  href,
  label,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      transition={{ duration: 0.55 }}
      viewport={viewport}
      className="flex h-full flex-col rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 backdrop-blur-xl sm:rounded-[2rem] sm:p-6"
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[color:var(--accent)]">
        {icon}
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
        {description}
      </p>

      <div className="mt-auto pt-5">
        <Link
          href={href}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[color:var(--border)] px-5 py-3 text-sm font-semibold transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
        >
          {label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.section>
  );
}

function formatPhaseLabel(phase: string) {
  return phase
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}