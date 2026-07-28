"use client";

import { motion } from "framer-motion";
import { TESTIMONIALS } from "@/lib/constants";
import Image from "next/image";
import { Star } from "lucide-react";

export function TestimonialsSection() {
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
    <section className="section-padding relative overflow-hidden">
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
            <span className="text-sm font-medium text-[color:var(--accent)]">Testimonials</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[color:var(--text-primary)] mb-4">
            Loved by Our Clients
          </h2>
          <p className="text-lg text-[color:var(--text-secondary)]">
            Real results from real businesses
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="
            -mx-6 px-6
            flex gap-4 overflow-x-auto pb-5 snap-none
            md:mx-0 md:px-0 md:overflow-visible md:pb-0 md:snap-x md:snap-mandatory
            scrollbar-hide
          "
        >
          {TESTIMONIALS.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="
                glass p-5 rounded-2xl flex flex-col

                shrink-0 w-[78%] max-w-[300px]

                snap-none md:w-auto md:max-w-none md:shrink md:snap-center md:p-8 md:max-w-[380px]
              "
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className="fill-[color:var(--accent)] text-[color:var(--accent)]"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[color:var(--text-secondary)] mb-6 flex-grow italic">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-6 border-t border-[color:var(--border)]">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-[color:var(--text-primary)]">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-[color:var(--text-secondary)]">
                    {testimonial.role} at {testimonial.business}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
