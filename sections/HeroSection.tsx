"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { VelarisBackground } from "@/components/site/VelarisBackground";
import { VirtueOrb } from "@/components/vigil/VirtueOrb";
import { HERO } from "@/lib/site-copy";

/**
 * The hero is the one place the site is allowed to be atmospheric: the
 * Velaris-style field fills the viewport, the words sit in the clear
 * centre, and Virtue is present as herself.
 */
export function HeroSection() {
  return (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden">
      <VelarisBackground className="absolute inset-0 -z-10 h-full w-full" />
      {/* Fade into the page so the next section does not feel like a cut. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-[linear-gradient(to_bottom,transparent,var(--bg-primary))]" aria-hidden />

      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }} className="max-w-3xl">
          <Link href="/virtue" className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-primary)]/40 py-1.5 pl-1.5 pr-3.5 text-[12px] font-medium text-[color:var(--text-primary)] backdrop-blur-md transition-colors hover:bg-[color:var(--bg-primary)]/60">
            <VirtueOrb size="sm" label="" />
            <span>Virtue sets up every customer</span>
            <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <h1 className="mt-7 font-[family-name:var(--font-space-grotesk)] text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.02em] text-[color:var(--text-primary)] sm:text-6xl lg:text-7xl">
            You run the business.
            <br />
            <span className="text-[color:var(--text-primary)] opacity-70">Vigil runs the digital side of it.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-[color:var(--text-primary)] opacity-80 sm:text-lg sm:leading-8">{HERO.lead}</p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={HERO.primary.href} className="btn-primary min-h-12 !px-6 text-sm font-semibold">
              {HERO.primary.label} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href={HERO.secondary.href} className="btn-secondary min-h-12 !px-6 text-sm font-medium">
              {HERO.secondary.label}
            </Link>
          </div>

          <p className="mt-8 text-[12px] uppercase tracking-[0.18em] text-[color:var(--text-secondary)]">{HERO.eyebrow}</p>
        </motion.div>
      </div>
    </section>
  );
}
