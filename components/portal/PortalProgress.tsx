"use client";

import { motion } from "framer-motion";
import { trustPoints } from "./portalData";

export default function PortalProgress() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {trustPoints.map((item, index) => {
        const Icon = item.icon;

        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: index * 0.08, duration: 0.5 }}
            className="rounded-[1.75rem] border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6 backdrop-blur-xl"
          >
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[color:var(--accent)]">
              <Icon className="h-5 w-5" />
            </div>

            <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">
              {item.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
              {item.description}
            </p>
          </motion.div>
        );
      })}
    </section>
  );
}