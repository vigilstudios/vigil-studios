"use client";

import { motion } from "framer-motion";
import { SERVICES } from "@/lib/constants";
import { ArrowRight } from "lucide-react";

export function ServicesSection() {
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
    <section id="services" className="section-padding relative overflow-hidden">
      <div className="container-wide">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-2xl mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 mb-6">
            <div className="w-2 h-2 rounded-full bg-[color:var(--accent)]" />
            <span className="text-sm font-medium text-[color:var(--accent)]">Services</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-[color:var(--text-primary)] mb-4">
            What We Offer
          </h2>
          <p className="text-lg text-[color:var(--text-secondary)]">
            Comprehensive web solutions tailored to your business needs
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="
            -mx-6 px-6
            grid grid-flow-col auto-cols-[85%] grid-rows-2 gap-6
            overflow-x-auto snap-x snap-mandatory pb-6

            md:mx-0 md:px-0
            md:grid-flow-row md:auto-cols-auto md:grid-rows-none md:grid-cols-2
            md:overflow-visible md:snap-none md:pb-0

            lg:grid-cols-3

            scrollbar-hide
          "
        >
          {SERVICES.map((service) => {
            const Icon = service.icon;

            return (
              <motion.div
                key={service.id}
                variants={itemVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="
                  group glass p-8 rounded-2xl
                  snap-center
                  hover:border-[color:var(--accent)]/50
                  transition-all duration-300
                "
              >
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-lg bg-[color:var(--accent)]/10 flex items-center justify-center group-hover:bg-[color:var(--accent)]/20 transition-colors">
                    <Icon
                      size={24}
                      className="text-[color:var(--accent)] group-hover:scale-110 transition-transform"
                    />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-[color:var(--text-primary)] mb-3">
                  {service.title}
                </h3>

                <p className="text-[color:var(--text-secondary)] mb-6 leading-relaxed">
                  {service.description}
                </p>

                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 text-[color:var(--accent)] hover:text-[color:var(--accent-hover)] font-medium transition-colors group/link"
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
