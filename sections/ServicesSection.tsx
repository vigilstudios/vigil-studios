"use client";

import { motion } from "framer-motion";
import { SERVICES } from "@/lib/constants";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { GradientEdge, SpotlightOverlay, handleSpotlightMove } from "@/components/ui/Spotlight";

/**
 * Bento spans keyed to SERVICES order, so the grid doesn't read as six
 * identical boxes. Spans total 9 across a 3-column grid, giving three full
 * rows with no gaps.
 */
const BENTO_SPANS = [
  "md:col-span-2",
  "md:col-span-1",
  "md:col-span-1",
  "md:col-span-2",
  "md:col-span-1",
  "md:col-span-2",
];

export function ServicesSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section id="services" className="section-padding relative overflow-hidden">
      <AmbientGlow className="top-0 -left-40" size={620} opacity={0.28} />
      <AmbientGlow className="bottom-0 -right-48" size={520} opacity={0.2} />

      <div className="container-wide relative z-10">
        <SectionHeader
          eyebrow="Services"
          title="What We Offer"
          subtitle="Comprehensive web solutions tailored to your business needs"
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="
            -mx-6 px-6
            grid grid-flow-col auto-cols-[80%] grid-rows-2 gap-4
            overflow-x-auto pb-5 snap-none

            md:mx-0 md:px-0
            md:grid-flow-row md:auto-cols-auto md:grid-rows-none md:grid-cols-3
            md:overflow-visible md:pb-0 md:gap-5

            scrollbar-hide
          "
        >
          {SERVICES.map((service, index) => {
            const Icon = service.icon;
            const isWide = BENTO_SPANS[index] === "md:col-span-2";

            return (
              <motion.div
                key={service.id}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                onMouseMove={handleSpotlightMove}
                className={`
                  group group/spot glass p-5 rounded-2xl md:p-8
                  hover:border-[color:var(--accent)]/50
                  snap-none relative
                  transition-colors duration-300
                  flex flex-col
                  ${BENTO_SPANS[index]}
                `}
              >
                <SpotlightOverlay />
                {isWide && <GradientEdge />}

                <div
                  className={`flex items-start gap-5 ${isWide ? "md:flex-row" : "md:flex-col"} flex-col`}
                >
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-[color:var(--accent)]/10 flex items-center justify-center group-hover:bg-[color:var(--accent)]/20 transition-colors">
                    <Icon
                      size={24}
                      className="text-[color:var(--accent)] group-hover:scale-110 transition-transform"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[color:var(--text-primary)] mb-3">
                      {service.title}
                    </h3>
                    <p className="text-[color:var(--text-secondary)] leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>

                <a
                  href="#contact"
                  className="mt-auto pt-6 inline-flex items-center gap-2 text-[color:var(--accent)] hover:text-[color:var(--accent-hover)] font-medium transition-colors group/link w-fit"
                >
                  Learn More
                  <ArrowRight
                    size={16}
                    className="group-hover/link:translate-x-1 transition-transform"
                  />
                </a>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
