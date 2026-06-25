"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CalendlyPopup } from "@/components/CalendlyModal";

export function PortfolioSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section id="portfolio" className="section-padding relative overflow-hidden">
      <div className="container-wide">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-2xl mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[color:var(--text-primary)] mb-4">
            Projects Launching Soon
          </h2>
          <p className="text-lg text-[color:var(--text-secondary)]">
            We're currently accepting select 2026 projects to feature as our first client showcases.
          </p>
        </motion.div>

        {/* First Wave Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--accent)]/10 via-transparent to-transparent pointer-events-none" />

          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 mb-6">
              <div className="w-2 h-2 rounded-full bg-[color:var(--accent)] animate-pulse" />
              <span className="text-sm font-medium text-[color:var(--accent)]">
                Now accepting 2026 projects
              </span>
            </div>

            <h3 className="text-3xl md:text-5xl font-bold text-[color:var(--text-primary)] mb-6">
              Be one of the first businesses featured here.
            </h3>

            <p className="text-lg md:text-xl text-[color:var(--text-secondary)] mb-8 leading-relaxed">
              Vigil Studios is currently accepting a limited number of website projects
              for 2026. As new client websites launch, selected projects will be
              showcased here as part of our growing portfolio.
            </p>

            <div className="grid gap-4 md:grid-cols-3 text-left mb-10">
              {[
                "Custom-coded website",
                "Built for speed and SEO",
                "Designed to convert visitors",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-secondary)]/60 p-5"
                >
                  <p className="text-sm font-medium text-[color:var(--text-primary)]">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <CalendlyPopup className="btn-primary inline-flex items-center justify-center gap-2">
              Start Your Project
              <ArrowRight size={18} />
            </CalendlyPopup>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
