"use client";

import { motion } from "framer-motion";
import { DIFFERENTIATORS } from "@/lib/constants";
import { Check, X } from "lucide-react";

export function WhyVigilSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
    <section className="section-padding relative overflow-hidden">
      <div className="container-wide">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 mb-6">
            <div className="w-2 h-2 rounded-full bg-[color:var(--accent)]" />
            <span className="text-sm font-medium text-[color:var(--accent)]">Why Vigil</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[color:var(--text-primary)] mb-4">
            Why Choose Vigil Studios?
          </h2>
          <p className="text-lg text-[color:var(--text-secondary)]">
            We're different from typical website builders
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="overflow-x-auto mb-16"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-[color:var(--border)]">
                <th className="text-left py-4 px-4 font-bold text-[color:var(--text-primary)]">
                  Feature
                </th>
                <th className="text-center py-4 px-4 font-bold text-[color:var(--accent)]">
                  Vigil Studios
                </th>
                <th className="text-center py-4 px-4 font-bold text-[color:var(--text-secondary)]">
                  Templates & Builders
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "Custom Code", vigil: true, competitors: false },
                { feature: "SEO Optimized", vigil: true, competitors: false },
                { feature: "Lightning Fast", vigil: true, competitors: false },
                { feature: "Mobile First", vigil: true, competitors: true },
                { feature: "Unique Design", vigil: true, competitors: false },
                { feature: "Full Ownership", vigil: true, competitors: false },
                {
                  feature: "Ongoing Support",
                  vigil: true,
                  competitors: false,
                },
              ].map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-[color:var(--border)] hover:bg-[color:var(--bg-secondary)]/50 transition-colors"
                >
                  <td className="py-4 px-4 text-[color:var(--text-primary)]">
                    {row.feature}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {row.vigil ? (
                      <Check
                        size={20}
                        className="text-[color:var(--accent)] mx-auto"
                      />
                    ) : (
                      <X size={20} className="text-[color:var(--text-secondary)] mx-auto" />
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {row.competitors ? (
                      <Check
                        size={20}
                        className="text-[color:var(--text-secondary)] mx-auto"
                      />
                    ) : (
                      <X size={20} className="text-[color:var(--text-secondary)] mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Differentiators Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="
            -mx-6 px-6
            flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6

            md:mx-0 md:px-0
            md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6
            md:overflow-visible md:snap-none md:pb-0

            scrollbar-hide
          "
        >
          {DIFFERENTIATORS.map((diff) => (
            <motion.div
              key={diff.title}
              variants={itemVariants}
              className="
                glass p-6 rounded-2xl
                shrink-0 w-[82%] max-w-[340px] snap-center

                md:w-auto md:max-w-none md:shrink md:snap-none
              "
            >
              <div className="w-10 h-10 rounded-lg bg-[color:var(--accent)]/10 flex items-center justify-center mb-4">
                <Check size={20} className="text-[color:var(--accent)]" />
              </div>

              <h3 className="text-lg font-bold text-[color:var(--text-primary)] mb-2">
                {diff.title}
              </h3>

              <p className="text-[color:var(--text-secondary)] text-sm">
                {diff.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
