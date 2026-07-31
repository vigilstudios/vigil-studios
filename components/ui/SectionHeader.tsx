"use client";

import { motion } from "framer-motion";

type SectionHeaderProps = {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
};

/**
 * Shared section intro. Previously this markup was duplicated in six sections,
 * which is a large part of why they all read identically.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className = "",
}: SectionHeaderProps) {
  const centered = align === "center";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={`max-w-2xl mb-12 md:mb-16 ${centered ? "mx-auto text-center" : ""} ${className}`}
    >
      {eyebrow && (
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 mb-6 ${
            centered ? "mx-auto" : ""
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-[color:var(--accent)]" />
          <span className="text-sm font-medium text-[color:var(--accent)]">{eyebrow}</span>
        </div>
      )}

      <h2 className="text-4xl md:text-5xl font-bold text-[color:var(--text-primary)] mb-4">
        {title}
      </h2>

      {subtitle && <p className="text-lg text-[color:var(--text-secondary)]">{subtitle}</p>}
    </motion.div>
  );
}
