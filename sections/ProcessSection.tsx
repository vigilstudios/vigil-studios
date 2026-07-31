"use client";

import { motion } from "framer-motion";
import { PROCESS_STEPS } from "@/lib/constants";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function ProcessSection() {
  return (
    <section id="process" className="section-padding section-alt relative overflow-hidden">
      <div className="container-wide">
        <SectionHeader
          eyebrow="Process"
          title="Our Proven Process"
          subtitle="From discovery to launch, we follow a structured approach"
        />

        {/* Alternating timeline rather than a row of identical cards */}
        <div className="relative max-w-4xl mx-auto">
          {/* Spine */}
          <div
            className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-[color:var(--border)]"
            aria-hidden="true"
          />
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.2 }}
            style={{ transformOrigin: "top" }}
            className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-[color:var(--accent)] to-[color:var(--accent)]/10"
            aria-hidden="true"
          />

          <ol className="space-y-10 md:space-y-16">
            {PROCESS_STEPS.map((step, index) => {
              const Icon = step.icon;
              const flipped = index % 2 === 1;

              return (
                <motion.li
                  key={step.number}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  viewport={{ once: true, amount: 0.4 }}
                  className="relative pl-16 md:pl-0 md:grid md:grid-cols-2 md:gap-12 md:items-center"
                >
                  {/* Node */}
                  <div className="absolute left-6 md:left-1/2 top-1 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 z-10">
                    <div className="w-12 h-12 rounded-full bg-[color:var(--bg-section-alt)] border border-[color:var(--accent)]/40 flex items-center justify-center shadow-[0_0_0_6px_var(--bg-section-alt)]">
                      <Icon size={20} className="text-[color:var(--accent)]" />
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className={
                      flipped
                        ? "md:col-start-2 md:pl-12 md:text-left"
                        : "md:col-start-1 md:pr-12 md:text-right"
                    }
                  >
                    <div className="text-5xl md:text-6xl font-bold text-[color:var(--accent)]/15 leading-none mb-2">
                      {step.number}
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-[color:var(--text-primary)] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-[color:var(--text-secondary)] leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>

        {/* Timeline facts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto"
        >
          {[
            { label: "Average Timeline", value: "2-4 Weeks", accent: false },
            { label: "Number of Revisions", value: "2 Per Round", accent: false },
            { label: "Support After Launch", value: "Always Here", accent: true },
          ].map((fact) => (
            <div
              key={fact.label}
              className="text-center md:text-left border-t border-[color:var(--border)] pt-4"
            >
              <p className="text-[color:var(--text-secondary)] text-sm mb-2">{fact.label}</p>
              <p
                className={`text-2xl font-bold ${
                  fact.accent
                    ? "text-[color:var(--accent)]"
                    : "text-[color:var(--text-primary)]"
                }`}
              >
                {fact.value}
              </p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-12 flex justify-center"
        >
          <Link
            href="/process"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            View Our Full Process
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
