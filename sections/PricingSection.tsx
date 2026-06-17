"use client";

import { motion } from "framer-motion";
import { PRICING_TIERS } from "@/lib/constants";
import { Check } from "lucide-react";

export function PricingSection() {
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

  const maintenanceFeatures = [
    "Hosting management",
    "Security updates",
    "Performance monitoring",
    "Automated backups",
    "Uptime monitoring",
    "Minor content edits",
    "Priority email support",
    "Analytics reporting",
    "Bug fixes & maintenance",
  ];

  return (
    <section id="pricing" className="section-padding relative overflow-hidden">
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
            <span className="text-sm font-medium text-[color:var(--accent)]">Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[color:var(--text-primary)] mb-4">
            Transparent Pricing
          </h2>
          <p className="text-lg text-[color:var(--text-secondary)]">
            Choose the plan that fits your needs. All plans include free consultation.
          </p>
        </motion.div>

        
        {/* Pricing Cards Wrapper */}
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="
              -mx-6 px-6
              flex gap-6 overflow-x-auto snap-x snap-mandatory pb-8 pt-2

              md:mx-0 md:px-0
              md:grid md:grid-cols-3 md:gap-8
              md:overflow-visible md:snap-none md:pb-0 md:pt-0

              scrollbar-hide
            "
          >
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`
                  shrink-0 w-[85%] max-w-[360px] snap-center overflow-visible

                  md:w-full md:max-w-none md:shrink md:snap-none

                  ${tier.highlighted ? "relative" : ""}
                `}
              >
                {tier.highlighted && (
                  <div
                    className="
                      absolute -inset-1 md:-inset-6
                      rounded-2xl
                      bg-[color:var(--accent)]/4 md:bg-[color:var(--accent)]/12
                      blur-xl md:blur-3xl
                      opacity-50 md:opacity-80
                      pointer-events-none
                    "
                  />
                )}

              <motion.div
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className={`glass p-8 rounded-2xl flex flex-col h-full ${
                  tier.highlighted
                    ? "md:scale-105 border-[color:var(--accent)] border-2 relative z-10"
                    : "border border-[color:var(--border)]"
                }`}
              >
                {/* Badge */}
                {tier.highlighted && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 text-xs font-medium text-[color:var(--accent)]">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Price */}
                <h3 className="text-2xl font-bold text-[color:var(--text-primary)] mb-2">
                  {tier.name}
                </h3>

                <p className="text-[color:var(--text-secondary)] text-sm mb-6">
                  {tier.description}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-[color:var(--text-primary)]">
                    ${tier.price}
                  </span>
                  <span className="text-[color:var(--text-secondary)] text-sm">
                    /project
                  </span>
                </div>

                {/* CTA */}
                <a href="#contact" className="btn-primary mb-8 text-center w-full">
                  {tier.cta}
                </a>

                {/* Features */}
                <div className="space-y-4 flex-grow">
                  {tier.features.map((feature) => (
                    <div key={feature.label} className="flex items-start gap-3">
                      {feature.type === "check" ? (
                        <Check
                          size={18}
                          className="text-[color:var(--accent)] mt-1 flex-shrink-0"
                        />
                      ) : (
                        <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center text-xs font-bold text-[color:var(--accent)]">
                          {feature.value}
                        </span>
                      )}

                      <span className="text-[color:var(--text-secondary)] text-sm">
                        {feature.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          ))}
          </motion.div>
        </div>

        {/* Maintenance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 glass p-8 md:p-10 rounded-2xl"
        >
          <div className="flex flex-col items-center text-center mb-10">
            <h3 className="text-2xl font-bold text-[color:var(--text-primary)] mb-3">
              Website Care Plan
            </h3>

            <p className="text-[color:var(--text-secondary)] max-w-xl">
              Keep your website secure, fast, and up-to-date while you focus on running your business.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            
            <div className="shrink-0 text-center min-w-[220px]">
              {/* Annual */}
              <div>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-5xl font-bold text-[color:var(--accent)]">
                    $499
                  </p>

                  <span className="rounded-full border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/10 px-2 py-1 text-xs font-medium text-[color:var(--accent)]">
                    Save 15%
                  </span>
                </div>

                <p className="text-[color:var(--text-secondary)] text-sm mt-1">
                  Annually
                </p>
              </div>

              {/* Divider */}
              <div className="my-6 flex items-center justify-center gap-3">
                <div className="h-px flex-1 max-w-[48px] bg-[color:var(--border)]" />

                <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-secondary)]">
                  or
                </span>

                <div className="h-px flex-1 max-w-[48px] bg-[color:var(--border)]" />
              </div>

              {/* Monthly */}
              <div>
                
                <p className="text-3xl font-semibold text-[color:var(--text-primary)]">
                  $49
                </p>

                <p className="text-[color:var(--text-secondary)] text-sm mt-1">
                  Monthly
                </p>
              </div>
            </div>

            <div className="hidden md:block h-48 w-px bg-[color:var(--border)]" />

            <div className="w-full max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                {maintenanceFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 text-[color:var(--text-secondary)]"
                  >
                    <Check
                      size={16}
                      className="text-[color:var(--accent)] flex-shrink-0"
                    />

                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-[color:var(--text-secondary)]">
            Maintenance includes minor content updates. New pages, redesigns, and custom features are quoted separately.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
