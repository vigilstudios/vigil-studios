"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { CalendlyPopup } from "@/components/CalendlyModal";

export function HeroSection() {
  const [cursor, setCursor] = useState({ x: "50%", y: "50%" });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setCursor({ x: `${event.clientX}px`, y: `${event.clientY}px` });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">

      <div className="container-wide relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl"
        >
          {/* Eyebrow */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30">
              <div className="w-2 h-2 rounded-full bg-[color:var(--accent)]" />
              <span className="text-sm font-medium text-[color:var(--accent)]">
                New York-Based Web Development Agency
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-[color:var(--text-primary)] mb-6 leading-tight"
          >
            Websites that turn clicks into {" "}
            <span className="gradient-accent bg-clip-text text-transparent">
              customers.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-[color:var(--text-secondary)] mb-8 max-w-2xl"
          >
            We build websites designed to help your business stand out, rank higher, and generate more leads.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mb-12">
              <CalendlyPopup className="btn-primary flex items-center justify-center gap-2">
                Book a Free Strategy Call
                <ArrowRight size={18} />
              </CalendlyPopup>
            <a href="#portfolio" className="btn-secondary flex items-center justify-center">
              View Our Work
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-3 gap-8 pt-8 border-t border-[color:var(--border)]"
          >
            {[
              { value: "100+", label: "Performance Scores" },
              { value: "SEO", label: "Optimized" },
              { value: "100%", label: "Responsive" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-bold text-[color:var(--accent)] mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-[color:var(--text-secondary)]">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <ChevronDown size={24} className="text-[color:var(--text-secondary)]" />
      </motion.div>
    </section>
  );
}
