"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import { CalendlyPopup } from "@/components/CalendlyModal";

export function ContactSection() {
  return (
    <section id="contact" className="section-padding relative overflow-hidden">
      <div className="container-wide">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
              <span className="text-sm font-medium text-[color:var(--accent)]">
                Contact
              </span>
            </div>

            <h2 className="mb-6 text-4xl font-bold text-[color:var(--text-primary)] md:text-5xl">
              Let's Work Together
            </h2>

            <p className="mb-8 text-lg text-[color:var(--text-secondary)]">
              Ready to take your online presence to the next level? Schedule a
              free strategy call and let’s map out the best path forward.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent)]/10">
                  <Mail size={20} className="text-[color:var(--accent)]" />
                </div>

                <div>
                  <p className="mb-1 text-sm text-[color:var(--text-secondary)]">
                    Email
                  </p>
                  <a
                    href="mailto:hello@vigilstudios.co"
                    className="text-[color:var(--text-primary)] transition-colors hover:text-[color:var(--accent)]"
                  >
                    hello@vigilstudios.co
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent)]/10">
                  <MapPin size={20} className="text-[color:var(--accent)]" />
                </div>

                <div>
                  <p className="mb-1 text-sm text-[color:var(--text-secondary)]">
                    Service Area
                  </p>
                  <p className="text-[color:var(--text-primary)]">
                    Serving businesses nationwide
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent)]/10">
                  <Phone size={20} className="text-[color:var(--accent)]" />
                </div>

                <div>
                  <p className="mb-1 text-sm text-[color:var(--text-secondary)]">
                    Schedule a Call
                  </p>

                  <CalendlyPopup className="text-left text-[color:var(--text-primary)] transition-colors hover:text-[color:var(--accent)]">
                    Book via Calendly
                  </CalendlyPopup>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - CTA Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="glass flex flex-col justify-center rounded-2xl p-8 lg:p-12"
          >
            <h3 className="mb-4 text-2xl font-bold text-[color:var(--text-primary)]">
              Ready to start?
            </h3>

            <p className="mb-8 text-[color:var(--text-secondary)]">
              Book a free strategy call and we’ll talk through your goals,
              timeline, budget, and the best path forward for your website.
            </p>

            <CalendlyPopup className="btn-primary mb-4 w-full">
              Book a Free Strategy Call
            </CalendlyPopup>

            <a
              href="mailto:hello@vigilstudios.co"
              className="inline-flex w-full items-center justify-center rounded-lg border border-[color:var(--border)] px-5 py-3 text-[color:var(--text-primary)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            >
              Email Us Instead
            </a>

            <p className="mt-6 text-center text-xs text-[color:var(--text-secondary)]">
              Prefer not to book yet? Send a quick email and we’ll respond
              within 24 hours.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
