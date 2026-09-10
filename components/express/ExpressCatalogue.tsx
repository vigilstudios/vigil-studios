"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Monitor,
  Smartphone,
} from "lucide-react";
import { EXPRESS_TEMPLATES } from "@/lib/constants";
import accentsBySlug from "@/lib/express-accents.json";
import styles from "./ExpressCatalogue.module.css";

const ACCENTS = accentsBySlug as Record<string, string>;
type ExpressTemplate = (typeof EXPRESS_TEMPLATES)[number];
type ViewMode = "desktop" | "mobile";

type IndustryGroup = {
  industry: string;
  variants: ExpressTemplate[];
};

function groupTemplates(): IndustryGroup[] {
  return EXPRESS_TEMPLATES.reduce<IndustryGroup[]>((groups, template) => {
    const existing = groups.find((group) => group.industry === template.industry);
    if (existing) existing.variants.push(template);
    else groups.push({ industry: template.industry, variants: [template] });
    return groups;
  }, []);
}

const INDUSTRIES = groupTemplates().sort((a, b) =>
  a.industry.localeCompare(b.industry)
);
const MOBILE_VIEWPORT_QUERY = "(max-width: 767px)";
const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? "32%" : "-32%",
    scale: 0.94,
  }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? "-28%" : "28%",
    scale: 0.96,
  }),
};

function subscribeToMobileViewport(onChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_VIEWPORT_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getMobileViewportSnapshot() {
  return window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;
}

function getServerMobileViewportSnapshot() {
  return false;
}

function readableAccentText(hex: string) {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return "#ffffff";

  const channels = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(value.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return luminance > 0.42 ? "#07120a" : "#ffffff";
}

function PreviewPeek({
  template,
  side,
  onSelect,
}: {
  template: ExpressTemplate;
  side: "previous" | "next";
  onSelect: () => void;
}) {
  const accent = ACCENTS[template.slug] ?? template.accent;

  return (
    <motion.button
      key={`${side}-${template.slug}`}
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, x: side === "previous" ? -36 : 36, scale: 0.68 }}
      animate={{ opacity: 0.52, x: 0, scale: 0.76 }}
      exit={{ opacity: 0, x: side === "previous" ? 36 : -36, scale: 0.68 }}
      whileHover={{ opacity: 0.86, scale: 0.8 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{ "--peek-accent": accent } as CSSProperties}
      className={`${styles.peek} ${
        side === "previous" ? styles.peekPrevious : styles.peekNext
      }`}
      aria-label={`Show ${template.industry}`}
    >
      <span className={styles.peekOutline} aria-hidden="true" />
      <span className={styles.peekLabel}>{template.industry}</span>
    </motion.button>
  );
}

export function ExpressCatalogue() {
  const industries = INDUSTRIES;
  const [industryIndex, setIndustryIndex] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const industryTabsRef = useRef<HTMLDivElement>(null);
  const isMobileViewport = useSyncExternalStore(
    subscribeToMobileViewport,
    getMobileViewportSnapshot,
    getServerMobileViewportSnapshot
  );
  const effectiveViewMode = isMobileViewport ? "mobile" : viewMode;

  const group = industries[industryIndex];
  const active = group.variants[variantIndex] ?? group.variants[0];
  const previousIndex = (industryIndex - 1 + industries.length) % industries.length;
  const nextIndex = (industryIndex + 1) % industries.length;
  const previous = industries[previousIndex].variants[0];
  const next = industries[nextIndex].variants[0];
  const accent = ACCENTS[active.slug] ?? active.accent;
  const href = `/express-templates/${active.slug}.html`;

  useEffect(() => {
    const rail = industryTabsRef.current;
    const selected = rail?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!rail || !selected) return;

    const railBounds = rail.getBoundingClientRect();
    const selectedBounds = selected.getBoundingClientRect();
    const centeredLeft =
      rail.scrollLeft +
      selectedBounds.left -
      railBounds.left -
      (rail.clientWidth - selectedBounds.width) / 2;
    rail.scrollTo({ left: centeredLeft, behavior: "smooth" });
  }, [industryIndex]);

  function selectIndustry(nextIndustry: number, forcedDirection?: number) {
    if (nextIndustry === industryIndex) return;
    setDirection(forcedDirection ?? (nextIndustry > industryIndex ? 1 : -1));
    setIndustryIndex(nextIndustry);
    setVariantIndex(0);
  }

  return (
    <section
      className={styles.catalogue}
      style={
        {
          "--template-accent": accent,
          "--template-on-accent": readableAccentText(accent),
        } as CSSProperties
      }
      aria-labelledby="catalogue-title"
    >
      <div className={styles.ambient} aria-hidden="true" />

      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.heading}>
            <p>Express Sites</p>
            <h1 id="catalogue-title">Choose your starting point.</h1>
          </div>

          <div className={styles.viewSwitch} aria-label="Preview size">
            {(["desktop", "mobile"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={effectiveViewMode === mode}
                disabled={isMobileViewport && mode === "desktop"}
                title={
                  isMobileViewport && mode === "desktop"
                    ? "Desktop preview is available on larger screens"
                    : undefined
                }
                onClick={() => setViewMode(mode)}
              >
                {mode === "desktop" ? <Monitor size={16} /> : <Smartphone size={16} />}
                <span>{mode === "desktop" ? "Desktop" : "Mobile"}</span>
                {effectiveViewMode === mode && (
                  <motion.span
                    layoutId="view-mode"
                    className={styles.switchIndicator}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
              </button>
            ))}
          </div>
        </header>

        <div
          ref={industryTabsRef}
          className={styles.industryTabs}
          role="tablist"
          aria-label="Industries"
        >
          {industries.map((industry, index) => (
            <button
              key={industry.industry}
              type="button"
              role="tab"
              id={`industry-tab-${index}`}
              aria-selected={industryIndex === index}
              aria-controls="template-stage"
              onClick={() => selectIndustry(index)}
            >
              <span>{industry.industry}</span>
              {industryIndex === index && (
                <motion.span
                  layoutId="industry-tab"
                  className={styles.industryIndicator}
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className={styles.variantRow}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={group.industry}
              className={styles.variantTabs}
              role="tablist"
              aria-label={`${group.industry} variants`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.24 }}
            >
              {group.variants.map((variant, index) => (
                <button
                  key={variant.slug}
                  type="button"
                  role="tab"
                  aria-selected={variantIndex === index}
                  aria-controls="template-stage"
                  onClick={() => {
                    setDirection(index >= variantIndex ? 1 : -1);
                    setVariantIndex(index);
                  }}
                >
                  {variant.variant}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          id="template-stage"
          className={styles.stage}
          role="tabpanel"
          aria-labelledby={`industry-tab-${industryIndex}`}
          aria-live="polite"
        >
          <AnimatePresence initial={false}>
            <PreviewPeek
              key={`previous-${previous.slug}`}
              template={previous}
              side="previous"
              onSelect={() => selectIndustry(previousIndex, -1)}
            />
            <PreviewPeek
              key={`next-${next.slug}`}
              template={next}
              side="next"
              onSelect={() => selectIndustry(nextIndex, 1)}
            />
          </AnimatePresence>

          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={active.slug}
              custom={direction}
              variants={slideVariants}
              className={styles.activeSlide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.previewFrame}>
                <button
                  type="button"
                  className={`${styles.carouselButton} ${styles.carouselPrevious}`}
                  onClick={() => selectIndustry(previousIndex, -1)}
                  aria-label={`Previous industry: ${previous.industry}`}
                >
                  <ArrowLeft size={19} />
                </button>

                <motion.div
                  layout
                  className={`${styles.browser} ${
                    effectiveViewMode === "desktop" ? styles.desktop : styles.mobile
                  }`}
                  transition={{
                    layout: { type: "spring", stiffness: 210, damping: 28 },
                  }}
                >
                  <div className={styles.browserBar}>
                    <span className={styles.browserDots} aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className={styles.browserAddress}>
                      {active.slug}.preview
                    </span>
                    <span className={styles.viewportLabel}>
                      {effectiveViewMode === "desktop" ? "1200 px" : "390 px"}
                    </span>
                  </div>
                  <div className={styles.viewport}>
                    <iframe
                      src={href}
                      title={`${active.industry}, ${active.variant} preview`}
                      tabIndex={-1}
                      loading="eager"
                    />
                  </div>
                </motion.div>

                <button
                  type="button"
                  className={`${styles.carouselButton} ${styles.carouselNext}`}
                  onClick={() => selectIndustry(nextIndex, 1)}
                  aria-label={`Next industry: ${next.industry}`}
                >
                  <ArrowRight size={19} />
                </button>
              </div>

              <div className={styles.slideFooter}>
                <div className={styles.templateIdentity}>
                  <p>
                    {active.industry} / {active.variant}
                  </p>
                  <h2>{active.example}</h2>
                </div>

                <div className={styles.actions}>
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    View
                    <ArrowUpRight size={17} />
                  </a>
                  <Link href="/#contact" className={styles.enquire}>
                    Enquire
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
