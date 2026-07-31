"use client";

import { motion } from "framer-motion";
import { DIFFERENTIATORS } from "@/lib/constants";
import { Check, X } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { SpotlightOverlay, handleSpotlightMove } from "@/components/ui/Spotlight";

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
    <section className="section-padding section-alt relative overflow-hidden">
      <AmbientGlow className="top-1/4 -right-56" size={640} opacity={0.22} />

      <div className="container-wide relative z-10">
        <SectionHeader
          eyebrow="Why Vigil"
          title="Why Choose Vigil Studios?"
          subtitle="We're different from typical website builders"
          align="center"
        />

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
            flex gap-4 overflow-x-auto pb-5 snap-none

            md:mx-0 md:px-0
            md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6
            md:overflow-visible md:pb-0 md:snap-x md:snap-mandatory

            scrollbar-hide
          "
        >
          {DIFFERENTIATORS.map((diff) => (
            <motion.div
              key={diff.title}
              variants={itemVariants}
              onMouseMove={handleSpotlightMove}
              className="
                group/spot relative glass p-4 rounded-2xl
                shrink-0 w-[74%] max-w-[280px]

                snap-none md:w-auto md:max-w-none md:shrink md:snap-center md:p-6 md:max-w-[340px]
              "
            >
              <SpotlightOverlay radius={280} />

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
