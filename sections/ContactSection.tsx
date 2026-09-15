"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import { CalendlyPopup } from "@/components/CalendlyModal";
import { AmbientGlow } from "@/components/ui/AmbientGlow";

export function ContactSection() {
  return (
    <section id="contact" className="relative overflow-hidden py-16 sm:py-24">
      <AmbientGlow className="-bottom-40 left-1/4" size={700} opacity={0.26} />

      <div className="container-wide relative z-10">
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

            <h2 className="mb-6 text-3xl font-semibold tracking-tight text-[color:var(--text-primary)] sm:text-4xl">
              Talk to a person.
            </h2>

            <p className="mb-8 text-base leading-7 text-[color:var(--text-secondary)] sm:text-lg">
              Not sure which build or plan fits, or you need something custom? Write to us or book fifteen minutes. No pitch, just answers.
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
            className="glass flex flex-col justify-center rounded-2xl p-5 lg:p-12"
          >
            <h3 className="mb-4 text-2xl font-semibold tracking-tight text-[color:var(--text-primary)]">
              Fifteen minutes with a person
            </h3>

            <p className="mb-8 text-[color:var(--text-secondary)]">
              Bring your questions about the build, the plan, your domain or a custom idea. We will tell you plainly what fits.
            </p>

            <CalendlyPopup className="btn-primary mb-4 w-full">
              Book a call
            </CalendlyPopup>

            <a
              href="mailto:hello@vigilstudios.co"
              className="inline-flex w-full items-center justify-center rounded-lg border border-[color:var(--border)] px-5 py-3 text-[color:var(--text-primary)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            >
              Email us instead
            </a>

            <p className="mt-6 text-center text-xs text-[color:var(--text-secondary)]">
              Prefer email? We reply within one business day.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
