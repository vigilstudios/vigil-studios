"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { CalendlyPopup } from "@/components/CalendlyModal";

/**
 * Full-bleed accent band. Deliberately breaks the dark section rhythm and gives
 * the page a mid-scroll conversion point.
 */
export function CtaBandSection() {
  return (
    <section className="section-accent snap-optional relative overflow-hidden py-16 md:py-24">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.4 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8"
        >
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              Your website should be your best salesperson.
            </h2>
            <p className="text-base md:text-lg opacity-80">
              Book a free strategy call and we&apos;ll show you exactly what&apos;s holding your
              current site back.
            </p>
          </div>

          <CalendlyPopup className="shrink-0 self-start inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold bg-[color:var(--on-accent)] text-[color:var(--accent)] hover:opacity-90 transition-opacity active:scale-95">
            Book a Free Strategy Call
            <ArrowRight size={18} />
          </CalendlyPopup>
        </motion.div>
      </div>
    </section>
  );
}
