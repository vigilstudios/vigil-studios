"use client";

import { motion } from "framer-motion";
import PortalSection from "./PortalSection";
import { buildProgress } from "./portalData";

export default function BuildProgress() {
  return (
    <PortalSection
      eyebrow="Build Progress"
      title="A future home for real-time project status."
      description="For now, this is a preview of the progress tracker. Later, this section will pull live status updates from Supabase."
    >
      <div className="grid gap-4 md:grid-cols-5">
        {buildProgress.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-[color:var(--text-primary)]">
                {item.label}
              </p>
              <p className="text-xs text-[color:var(--text-secondary)]">
                {item.value}%
              </p>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-[color:var(--bg-surface-soft)]">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${item.value}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="h-full rounded-full bg-[color:var(--accent)]"
              />
            </div>
          </div>
        ))}
      </div>
    </PortalSection>
  );
}