"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedGridBackground } from "@/components/ui/AnimatedGridBackground";
import {
  Search,
  FileText,
  ShieldCheck,
  ClipboardCheck,
  Palette,
  Code2,
  MonitorCheck,
  Rocket,
  LifeBuoy,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { CalendlyPopup } from "@/components/CalendlyModal";

const roadmapSteps = [
  {
    number: "01",
    title: "Strategy Call",
    icon: Search,
    timeline: "Day 1",
    description:
      "We discuss your business, goals, current website, audience, budget, and what success looks like.",
    deliverables: ["Goals clarified", "Needs identified", "Best package recommended"],
  },
  {
    number: "02",
    title: "Proposal & Scope",
    icon: FileText,
    timeline: "Day 1-2",
    description:
      "After the call, you receive a clear proposal outlining pages, features, pricing, timeline, deliverables, and expectations.",
    deliverables: ["Project scope", "Timeline", "Exact pricing"],
  },
  {
    number: "03",
    title: "Contract & Payment",
    icon: ShieldCheck,
    timeline: "Before work begins",
    description:
      "Once approved, the agreement is signed and the initial payment is completed. No design or development work begins until both are complete.",
    deliverables: ["Signed agreement", "Payment completed", "Project officially started"],
  },
  {
    number: "04",
    title: "Client Onboarding",
    icon: ClipboardCheck,
    timeline: "Day 2-3",
    description:
      "You receive a private onboarding link with instructions for sending brand assets, content, login access, photos, domain info, and business details.",
    deliverables: ["Logo/assets", "Website content", "Domain/access details"],
  },
  {
    number: "05",
    title: "Design Direction",
    icon: Palette,
    timeline: "Week 1",
    description:
      "We establish the visual direction for your website including layout, colors, typography, section flow, and overall brand feel.",
    deliverables: ["Visual direction", "Homepage structure", "Brand styling"],
  },
  {
    number: "06",
    title: "Website Build",
    icon: Code2,
    timeline: "Week 1-3",
    description:
      "Your website is custom-coded for speed, mobile responsiveness, SEO structure, animations, and a polished user experience.",
    deliverables: ["Responsive website", "SEO foundation", "Contact forms"],
  },
  {
    number: "07",
    title: "Review & Revisions",
    icon: MonitorCheck,
    timeline: "Week 2-4",
    description:
      "You review the site and request revisions. We refine layout details, copy, spacing, mobile views, and final polish.",
    deliverables: ["Revision round", "Mobile polish", "Final approval"],
  },
  {
    number: "08",
    title: "Launch",
    icon: Rocket,
    timeline: "Launch Day",
    description:
      "After approval and final payment, we connect the domain, deploy the site, test forms, confirm performance, and launch.",
    deliverables: ["Live website", "Domain setup", "Final testing"],
  },
  {
    number: "09",
    title: "Post-Launch Support",
    icon: LifeBuoy,
    timeline: "Ongoing",
    description:
      "After launch, we remain available for maintenance, edits, hosting support, SEO improvements, and future upgrades.",
    deliverables: ["Maintenance options", "Content updates", "Long-term support"],
  },
];

const preStartSteps = [
  "Strategy Call",
  "Proposal Sent",
  "Contract Signed",
  "Payment Completed",
];

export function ProcessRoadmap() {
  return (
    <main className="relative overflow-hidden">
      <AnimatedGridBackground />

      <section className="px-4 pt-28 pb-20 md:section-padding relative">
        <div className="container-wide relative">
          {/* Hero */}
          <div className="max-w-4xl mx-auto text-center mb-12 md:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 mb-6"
            >
              <div className="w-2 h-2 rounded-full bg-[color:var(--accent)]" />
              <span className="text-sm font-medium text-[color:var(--accent)]">
                Our Process
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-6xl font-bold text-[color:var(--text-primary)] mb-5 leading-tight"
            >
              A clear roadmap from first call to launch.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-xl text-[color:var(--text-secondary)] leading-relaxed max-w-2xl mx-auto"
            >
              Every project follows a structured process so you always know what
              is happening, what comes next, and what is needed from you.
            </motion.p>
          </div>

          {/* Before Start Section */}
          <section className="max-w-5xl mx-auto mb-12 md:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="glass rounded-3xl p-5 sm:p-6 md:p-10 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--accent)]/10 via-transparent to-transparent opacity-60 pointer-events-none" />

              <div className="relative z-10">
                <h2 className="text-2xl md:text-4xl font-bold text-[color:var(--text-primary)] mb-3">
                  Before the project starts
                </h2>

                <p className="text-[color:var(--text-secondary)] text-base md:text-lg mb-6 md:mb-8 max-w-3xl leading-relaxed">
                  We keep the business side clear before design or development
                  begins. Scope, contract, payment, and onboarding are handled
                  upfront so there are no surprises.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {preStartSteps.map((item, index) => (
                    <motion.div
                      key={item}
                      whileHover={{ y: -4 }}
                      transition={{ type: "spring", stiffness: 220, damping: 18 }}
                      className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-secondary)]/70 p-4 md:p-5 text-center"
                    >
                      <div className="mx-auto mb-4 w-10 h-10 rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 flex items-center justify-center text-[color:var(--accent)] font-bold">
                        {index + 1}
                      </div>

                      <p className="text-sm font-medium text-[color:var(--text-primary)]">
                        {item}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>

          {/* Roadmap */}
          <div className="max-w-5xl mx-auto">
            {roadmapSteps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === roadmapSteps.length - 1;

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="grid grid-cols-[56px_1fr] md:grid-cols-[120px_1fr] gap-4 md:gap-10">
                    {/* Left Rail */}
                    <div className="flex flex-col items-center gap-3 md:gap-4">
                      <motion.div
                        whileHover={{ rotate: 3, scale: 1.06 }}
                        transition={{ type: "spring", stiffness: 240, damping: 16 }}
                        className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 flex items-center justify-center relative z-10"
                      >
                        <Icon className="w-5 h-5 md:w-7 md:h-7 text-[color:var(--accent)]" />
                      </motion.div>

                      {!isLast && (
                        <div className="w-0.5 flex-1 min-h-8 md:min-h-24 bg-gradient-to-b from-[color:var(--accent)] to-[color:var(--accent)]/10" />
                      )}
                    </div>

                    {/* Card */}
                    <motion.div
                      whileHover={{ y: -6, scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 220, damping: 18 }}
                      className="glass rounded-2xl md:rounded-3xl p-5 md:p-8 mb-6 md:mb-12 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--accent)]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
                          <div>
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <span className="text-3xl md:text-4xl font-bold text-[color:var(--accent)]/25">
                                {step.number}
                              </span>

                              <span className="text-xs md:text-sm px-3 py-1 rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 text-[color:var(--accent)]">
                                {step.timeline}
                              </span>
                            </div>

                            <h2 className="text-xl md:text-3xl font-bold text-[color:var(--text-primary)] mb-3">
                              {step.title}
                            </h2>

                            <p className="text-sm md:text-base text-[color:var(--text-secondary)] leading-relaxed max-w-2xl">
                              {step.description}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {step.deliverables.map((item) => (
                            <div
                              key={item}
                              className="flex items-center gap-2 rounded-2xl bg-[color:var(--bg-secondary)]/70 border border-[color:var(--border)] px-4 py-3"
                            >
                              <CheckCircle2
                                size={16}
                                className="text-[color:var(--accent)] shrink-0"
                              />
                              <span className="text-sm text-[color:var(--text-secondary)]">
                                {item}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto mt-8 md:mt-12 glass rounded-3xl p-6 md:p-12 text-center"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-[color:var(--text-primary)] mb-4">
              Ready to start your website?
            </h2>

            <p className="text-[color:var(--text-secondary)] text-base md:text-lg mb-8 leading-relaxed">
              Book a free strategy call and we’ll walk through your goals,
              timeline, and the best package for your business.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <CalendlyPopup className="btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto">
                Book a Strategy Call
                <ArrowRight size={18} />
              </CalendlyPopup>

              <Link
                href="/#pricing"
                className="btn-secondary inline-flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                View Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}