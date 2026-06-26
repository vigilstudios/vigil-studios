"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";
import PortalSection from "./PortalSection";
import { checklistItems } from "./portalData";

export default function ClientChecklist() {
  const [completed, setCompleted] = useState<string[]>(["communication"]);

  const completedCount = completed.length;

  const progress = useMemo(
    () => Math.round((completedCount / checklistItems.length) * 100),
    [completedCount],
  );

  function toggleItem(id: string) {
    setCompleted((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <PortalSection
      eyebrow="Client Checklist"
      title="What we need from you."
      description="Complete these items so we can move into design and development without delays."
      className="scroll-mt-28"
    >
      <div id="client-checklist">
        <div className="mb-6 rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-[color:var(--text-primary)]">
              Onboarding progress
            </p>
            <p className="text-sm text-[color:var(--accent)]">
              {progress}% complete
            </p>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-[color:var(--bg-surface-soft)]">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45 }}
              className="h-full rounded-full bg-[color:var(--accent)]"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {checklistItems.map((item) => {
            const Icon = item.icon;
            const isDone = completed.includes(item.id);

            return (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`group flex w-full items-start gap-4 rounded-[1.5rem] border p-5 text-left transition ${
                  isDone
                    ? "border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)]"
                    : "border-[color:var(--border)] bg-[color:var(--bg-surface)] hover:bg-[color:var(--bg-surface-soft)]"
                }`}
              >
                <div className="mt-1 text-[color:var(--accent)]">
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5 text-[color:var(--text-secondary)]" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[color:var(--text-secondary)]" />
                    <h3 className="font-semibold text-[color:var(--text-primary)]">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-sm leading-6 text-[color:var(--text-secondary)]">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </PortalSection>
  );
}