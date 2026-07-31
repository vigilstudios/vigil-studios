"use client";

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, ChevronDown } from "lucide-react";
import { CalendlyPopup } from "@/components/CalendlyModal";
import {
  computeFrameRect,
  type FrameRect,
  type WireframeVariant,
} from "@/components/hero/WireframeWebsite";

const HeroWireframeScene = dynamic(() => import("@/components/hero/HeroWireframeScene"), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

const STATS = [
  { value: "100+", label: "Performance Scores", align: "text-left" },
  { value: "SEO", label: "Optimized", align: "text-center" },
  { value: "100%", label: "Responsive", align: "text-right" },
];

/** Horizontal padding inside the browser frame, as a fraction of frame width. */
const CONTENT_PAD_X = 0.055;

/**
 * Used until the canvas reports its real geometry — and if WebGL never starts,
 * so the hero copy is never dependent on the 3D scene to be visible.
 */
const FALLBACK_FRAME: FrameRect = { widthPct: 0.94, heightPct: 0.9, contentTopPct: 0.1 };

/** Below this stage aspect ratio the graphic becomes a phone rather than a browser. */
const PHONE_ASPECT = 1.15;

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // The page's real scroll container is #site-root (app/layout.tsx), not window.
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const [frameRect, setFrameRect] = useState<FrameRect | null>(null);
  const [variant, setVariant] = useState<WireframeVariant>("desktop");
  const reducedMotion = usePrefersReducedMotion();

  // A portrait stage gets a phone mockup instead of a desktop browser. Measuring
  // here (rather than waiting on the lazily-loaded canvas) means the overlay is
  // already positioned inside the frame on first paint.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (height <= 0) return;
      const aspect = width / height;
      const nextVariant = aspect < PHONE_ASPECT ? "phone" : "desktop";
      setVariant(nextVariant);
      setFrameRect(computeFrameRect(aspect, nextVariant));
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const root = document.getElementById("site-root");
    scrollContainerRef.current = root;
    if (!root || reducedMotion) return;

    // Desktop uses `scroll-snap-type: y mandatory`, which would yank the viewport
    // to the next section mid-sequence. Snapping resumes once the hero releases.
    root.style.setProperty("scroll-snap-type", "none", "important");
    return () => {
      root.style.removeProperty("scroll-snap-type");
    };
  }, [reducedMotion]);

  // Drives the pinned sequence: 1 when the sticky child reaches its last frame.
  const { scrollYProgress } = useScroll({
    container: scrollContainerRef,
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Only reaches 1 once the hero has fully scrolled off. Snapping must stay off
  // until then, or re-enabling `mandatory` would jump the viewport to Services
  // while the hero is still filling the screen.
  const { scrollYProgress: exitProgress } = useScroll({
    container: scrollContainerRef,
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  useMotionValueEvent(exitProgress, "change", (value) => {
    const root = scrollContainerRef.current;
    if (!root || reducedMotion) return;
    if (value < 0.999) {
      root.style.setProperty("scroll-snap-type", "none", "important");
    } else {
      root.style.removeProperty("scroll-snap-type");
    }
  });

  // Phase 1: the hero copy slides up out of the browser frame.
  const copyY = useTransform(scrollYProgress, [0, 0.16], ["0%", "-118%"]);
  const copyOpacity = useTransform(scrollYProgress, [0.07, 0.16], [1, 0]);
  const indicatorOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);
  // Phase 2: the wireframe site builds itself, then holds before releasing.
  const scrolledBuild = useTransform(scrollYProgress, [0.18, 0.92], [0, 1]);

  const staticBuild = useMotionValue(0);
  const buildProgress = reducedMotion ? staticBuild : scrolledBuild;

  const isPhone = variant === "phone";
  // The phone frame is a much narrower container, so cqw-based type needs its own scale.
  const type = isPhone
    ? {
        eyebrow: "clamp(8px, 3.3cqw, 13px)",
        headline: "clamp(20px, 8.8cqw, 34px)",
        body: "clamp(10px, 3.9cqw, 15px)",
        button: "clamp(10px, 3.4cqw, 14px)",
      }
    : {
        eyebrow: "clamp(8px, 1.7cqw, 16px)",
        headline: "clamp(21px, 6.6cqw, 76px)",
        body: "clamp(10px, 2.1cqw, 20px)",
        button: "clamp(10px, 1.7cqw, 17px)",
      };

  const rect = frameRect ?? FALLBACK_FRAME;
  const contentBox = {
    left: `${((1 - rect.widthPct) / 2 + rect.widthPct * CONTENT_PAD_X) * 100}%`,
    width: `${rect.widthPct * (1 - CONTENT_PAD_X * 2) * 100}%`,
    top: `${((1 - rect.heightPct) / 2 + rect.heightPct * rect.contentTopPct) * 100}%`,
    height: `${rect.heightPct * (1 - rect.contentTopPct) * 100}%`,
  };

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: reducedMotion ? "auto" : "320vh" }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div className="container-wide h-full flex flex-col justify-center gap-4 md:gap-6 pt-20 md:pt-24 pb-8 md:pb-12">
          {/* Wireframe stage with the hero copy living inside the browser frame */}
          <div ref={stageRef} className="relative w-full flex-1 min-h-0 max-w-6xl mx-auto">
            <div className="absolute inset-0" aria-hidden="true">
              <HeroWireframeScene
                buildProgress={buildProgress}
                reducedMotion={reducedMotion}
                variant={variant}
              />
            </div>

            <div
              className="absolute overflow-hidden pointer-events-none"
              style={{ ...contentBox, containerType: "inline-size" }}
            >
              <motion.div
                style={reducedMotion ? undefined : { y: copyY, opacity: copyOpacity }}
                className="h-full flex flex-col justify-center"
              >
                <div className={isPhone ? "mb-[4cqw]" : "mb-[2.5cqw]"}>
                  <div
                    className={`inline-flex items-center rounded-full bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/30 ${
                      isPhone
                        ? "gap-[1.6cqw] px-[3cqw] py-[1.4cqw]"
                        : "gap-[0.8cqw] px-[1.6cqw] py-[0.7cqw]"
                    }`}
                  >
                    <div
                      className={`rounded-full bg-[color:var(--accent)] ${
                        isPhone ? "w-[1.4cqw] h-[1.4cqw]" : "w-[0.7cqw] h-[0.7cqw]"
                      }`}
                    />
                    <span
                      className="font-medium text-[color:var(--accent)] whitespace-nowrap"
                      style={{ fontSize: type.eyebrow }}
                    >
                      New York-Based Web Development Agency
                    </span>
                  </div>
                </div>

                <h1
                  className={`font-bold text-[color:var(--text-primary)] leading-[1.05] ${
                    isPhone ? "mb-[3.5cqw]" : "mb-[2cqw]"
                  }`}
                  style={{ fontSize: type.headline }}
                >
                  Websites that turn clicks into{" "}
                  <span className="gradient-accent bg-clip-text text-transparent">
                    customers.
                  </span>
                </h1>

                <p
                  className={`text-[color:var(--text-secondary)] ${
                    isPhone ? "mb-[5cqw]" : "mb-[3cqw] max-w-[78%]"
                  }`}
                  style={{ fontSize: type.body }}
                >
                  We build websites designed to help your business stand out, rank higher, and
                  generate more leads.
                </p>

                <div
                  className={`flex pointer-events-auto ${
                    isPhone ? "flex-col gap-[3cqw] items-stretch" : "flex-row gap-[1.6cqw]"
                  }`}
                >
                  <CalendlyPopup
                    className={`btn-primary flex items-center justify-center whitespace-nowrap ${
                      isPhone
                        ? "!px-[4cqw] !py-[3cqw] !rounded-[2cqw] gap-[1.6cqw]"
                        : "!px-[2.4cqw] !py-[1.2cqw] !rounded-[0.9cqw] gap-[0.8cqw]"
                    }`}
                    style={{ fontSize: type.button }}
                  >
                    Book a Free Strategy Call
                    <ArrowRight className={isPhone ? "w-[4cqw] h-[4cqw]" : "w-[1.9cqw] h-[1.9cqw]"} />
                  </CalendlyPopup>
                  <a
                    href="#portfolio"
                    className={`btn-secondary flex items-center justify-center whitespace-nowrap ${
                      isPhone
                        ? "!px-[4cqw] !py-[3cqw] !rounded-[2cqw]"
                        : "!px-[2.4cqw] !py-[1.2cqw] !rounded-[0.9cqw]"
                    }`}
                    style={{ fontSize: type.button }}
                  >
                    View Our Work
                  </a>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Stats live outside the graphic */}
          <div className="shrink-0 grid grid-cols-3 gap-8 pt-6 border-t border-[color:var(--border)] max-w-6xl mx-auto w-full">
            {STATS.map((stat) => (
              <div key={stat.label} className={stat.align}>
                <div className="text-xl md:text-3xl font-bold text-[color:var(--accent)] mb-1">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-[color:var(--text-secondary)]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <motion.div
          style={reducedMotion ? undefined : { opacity: indicatorOpacity }}
          className="hidden md:block absolute bottom-4 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={reducedMotion ? undefined : { y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown size={24} className="text-[color:var(--text-secondary)]" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
