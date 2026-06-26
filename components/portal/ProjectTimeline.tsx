"use client";

import { motion } from "framer-motion";
import PortalSection from "./PortalSection";
import { timelineSteps } from "./portalData";

export default function ProjectTimeline() {
  return (
    <PortalSection
      eyebrow="Project Roadmap"
      title="Your path from onboarding to launch."
      description="This is the full project journey. Completed phases are locked in, the active phase shows what is happening now, and upcoming phases show what comes next."
      className="scroll-mt-28"
    >
      <div id="project-roadmap" className="relative">

        <div className="space-y-5">
          {timelineSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.status === "active";
            const isComplete = step.status === "complete";

            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.04, duration: 0.45 }}
                className={`relative grid gap-4 rounded-[1.5rem] border p-5 md:grid-cols-[auto_1fr_auto] md:items-center ${
                  isActive
                    ? "border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
                    : "border-[color:var(--border)] bg-[color:var(--bg-surface)]"
                }`}
              >
                <div
                  className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border ${
                    isComplete
                      ? "border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color:var(--accent)] text-[color:var(--bg-primary)]"
                      : isActive
                        ? "border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[color:var(--accent)]"
                        : "border-[color:var(--border)] bg-[color:var(--bg-surface-soft)] text-[color:var(--text-secondary)]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="font-semibold text-[color:var(--text-primary)]">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">
                    {step.description}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-medium capitalize ${
                    isComplete
                      ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[color:var(--accent)]"
                      : isActive
                        ? "bg-[color:var(--bg-surface-soft)] text-[color:var(--text-primary)]"
                        : "bg-[color:var(--bg-surface-soft)] text-[color:var(--text-secondary)]"
                  }`}
                >
                  {step.status}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </PortalSection>
  );
}