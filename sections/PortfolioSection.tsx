"use client";

import { motion } from "framer-motion";
import { PORTFOLIO_PROJECTS } from "@/lib/constants";
import { ArrowUpRight , ArrowRight } from "lucide-react";
import { CalendlyPopup } from "@/components/CalendlyModal";
import Image from "next/image";

export function PortfolioSection() {
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
    <section id="portfolio" className="section-padding relative overflow-hidden">
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
            <span className="text-sm font-medium text-[color:var(--accent)]">Portfolio</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[color:var(--text-primary)] mb-4">
            Recent Projects
          </h2>
          <p className="text-lg text-[color:var(--text-secondary)]">
            Websites we've built for businesses just like yours
          </p>
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="
            -mx-6 px-6
            flex gap-8 overflow-x-auto snap-x snap-mandatory pb-6

            md:mx-0 md:px-0
            md:grid md:grid-cols-2 md:gap-8
            md:overflow-visible md:snap-none md:pb-0

            scrollbar-hide
          "
        >
          {PORTFOLIO_PROJECTS.map((project) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="group glass rounded-2xl overflow-hidden
                shrink-0 w-[88%] max-w-[480px]
                snap-center

                md:w-auto md:max-w-none md:shrink md:snap-none
              "
            >
              {/* Image */}
              <div className="relative h-64 overflow-hidden bg-[color:var(--bg-secondary)]">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[--bg-primary]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div>
                    <p className="text-[color:var(--accent)] text-sm font-medium mb-2">
                      {project.results}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="inline-block px-3 py-1 rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 mb-3">
                      <span className="text-xs font-medium text-[color:var(--accent)]">
                        {project.industry}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-[color:var(--text-primary)]">
                      {project.title}
                    </h3>
                  </div>
                  <ArrowUpRight
                    size={20}
                    className="text-[color:var(--accent)] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                  />
                </div>

                <p className="text-[color:var(--text-secondary)] mb-6">
                  {project.description}
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs px-3 py-1 rounded-full bg-[color:var(--bg-secondary)] text-[color:var(--text-secondary)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <CalendlyPopup className="btn-primary inline-flex items-center justify-center gap-2">
              Start Your Project
              <ArrowRight size={18} />
          </CalendlyPopup>
        </motion.div>
      </div>
    </section>
  );
}
