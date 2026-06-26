"use client";

import { motion } from "framer-motion";
import { PROCESS_STEPS } from "@/lib/constants";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ProcessSection() {
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
    <section id="process" className="section-padding relative overflow-hidden">
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
            <span className="text-sm font-medium text-[color:var(--accent)]">Process</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[color:var(--text-primary)] mb-4">
            Our Proven Process
          </h2>
          <p className="text-lg text-[color:var(--text-secondary)]">
            From discovery to launch, we follow a structured approach
          </p>

        </motion.div>

        {/* Process Timeline */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {PROCESS_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <div className="relative">
                  {/* Connector Line */}
                  {index < PROCESS_STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-16 left-[50%] w-[calc(100%-2rem)] h-0.5 bg-gradient-to-r from-[--accent] to-[--accent]/20 transform translate-x-[50%]" />
                  )}

                  {/* Step Card */}
                  <div className="glass p-8 rounded-2xl h-full relative z-10">
                    {/* Number */}
                    <div className="text-4xl md:text-5xl font-bold text-[color:var(--accent)]/20 mb-4">
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className="w-12 h-12 rounded-lg bg-[color:var(--accent)]/10 flex items-center justify-center mb-6">
                      <Icon size={24} className="text-[color:var(--accent)]" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-[color:var(--text-primary)] mb-3">
                      {step.title}
                    </h3>
                    <p className="text-[color:var(--text-secondary)] text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Timeline Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 glass p-8 rounded-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-[color:var(--text-secondary)] text-sm mb-2">Average Timeline</p>
              <p className="text-2xl font-bold text-[color:var(--text-primary)]">2-4 Weeks</p>
            </div>
            <div>
              <p className="text-[color:var(--text-secondary)] text-sm mb-2">Number of Revisions</p>
              <p className="text-2xl font-bold text-[color:var(--text-primary)]">2 Revisions Per Round</p>
            </div>
            <div>
              <p className="text-[color:var(--text-secondary)] text-sm mb-2">Support After Launch</p>
              <p className="text-2xl font-bold text-[color:var(--accent)]">Always Here</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
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
