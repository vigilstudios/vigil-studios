"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Globe2,
  ImageIcon,
  Server,
  UploadCloud,
} from "lucide-react";

import { AnimatedGridBackground } from "@/components/ui/AnimatedGridBackground";

const steps = [
  {
    title: "Welcome",
    icon: CheckCircle2,
    description:
      "This guided onboarding process will collect everything needed for your website project.",
    tasks: [
      "Review each step carefully.",
      "Upload or prepare the requested materials.",
      "Click next once each step is complete.",
    ],
  },
  {
    title: "Brand Assets",
    icon: UploadCloud,
    description:
      "Upload your logo, brand colors, fonts, and any existing brand guidelines.",
    tasks: [
      "Upload your logo in SVG, PNG, or PDF format.",
      "Provide brand colors if available.",
      "Upload any brand guide or existing design files.",
    ],
  },
  {
    title: "Website Content",
    icon: FileText,
    description:
      "Provide the copy, images, and basic information needed for your website pages.",
    tasks: [
      "Provide homepage copy or notes.",
      "List your services or offers.",
      "Upload photos, testimonials, and contact information.",
    ],
  },
  {
    title: "Domain Setup",
    icon: Globe2,
    description:
      "Confirm the domain name your website will use and provide access if needed.",
    tasks: [
      "Confirm your domain name.",
      "Purchase a domain if you do not already have one.",
      "Invite hello@vigilstudios.co to your domain provider if supported.",
      "Do not email passwords.",
    ],
  },
  {
    title: "Hosting Setup",
    icon: Server,
    description:
      "Confirm how hosting will be handled so your website can be deployed properly.",
    tasks: [
      "Confirm whether Vigil Studios will manage hosting.",
      "If you already have hosting, provide provider details.",
      "We will send additional setup steps if access is required.",
    ],
  },
  {
    title: "Final Review",
    icon: ImageIcon,
    description:
      "Review your submitted onboarding details before we move into the design phase.",
    tasks: [
      "Confirm all required uploads are complete.",
      "Confirm domain and hosting information is accurate.",
      "Submit onboarding for review.",
    ],
  },
];

export default function ClientOnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);

  const step = steps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const goNext = () => {
    setCurrentStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setCurrentStep((current) => Math.max(current - 1, 0));
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--bg-primary)] text-[color:var(--text-primary)]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <AnimatedGridBackground />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-4 py-24 sm:px-6 lg:px-8">
        <Link
          href="/client-portal"
          className="mb-6 inline-flex w-fit items-center gap-2 text-sm text-[color:var(--text-secondary)] transition hover:text-[color:var(--accent)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between text-sm text-[color:var(--text-secondary)]">
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-[color:var(--bg-surface-soft)]">
            <motion.div
              className="h-full rounded-full bg-[color:var(--accent)]"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={step.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.3 }}
            className="rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5 backdrop-blur-xl sm:p-8"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[color:var(--accent)]">
              <Icon className="h-7 w-7" />
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {step.title}
            </h1>

            <p className="mt-4 text-sm leading-7 text-[color:var(--text-secondary)] sm:text-base">
              {step.description}
            </p>

            <div className="mt-8 space-y-3">
              {step.tasks.map((task) => (
                <div
                  key={task}
                  className="flex gap-3 rounded-[1rem] border border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--accent)]" />
                  <p className="text-sm leading-6 text-[color:var(--text-secondary)]">
                    {task}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={currentStep === 0}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--border)] px-5 py-3 text-sm font-semibold transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              {currentStep === steps.length - 1 ? (
                <Link
                  href="/client-portal"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-[color:var(--bg-primary)] transition hover:bg-[color:var(--accent-hover)]"
                >
                  Finish onboarding
                  <CheckCircle2 className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-[color:var(--bg-primary)] transition hover:bg-[color:var(--accent-hover)]"
                >
                  Next step
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.section>
        </AnimatePresence>
      </div>
    </main>
  );
}