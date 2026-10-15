"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CampaignLink } from "@/components/creators/CampaignLink";
import { withPurchasePreference, type PurchasePreference } from "@/lib/vigil/package-finder";
import { formatMoney } from "@/lib/vigil/format";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Hammer,
  Lock,
  Monitor,
  RotateCcw,
  Smartphone,
} from "lucide-react";
import type { ExpressTemplate } from "@/lib/vigil/express/document";
import styles from "./ExpressCatalogue.module.css";

type ViewMode = "desktop" | "mobile";

type IndustryGroup = {
  industry: string;
  variants: ExpressTemplate[];
};

function groupTemplates(templates: ExpressTemplate[]): IndustryGroup[] {
  return templates.reduce<IndustryGroup[]>((groups, template) => {
    const existing = groups.find((group) => group.industry === template.industry);
    if (existing) existing.variants.push(template);
    else groups.push({ industry: template.industry, variants: [template] });
    return groups;
  }, []);
}

// Preserve the published library's catalogue order.
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

// Render at a real device viewport, then scale every pixel together. Measuring
// the content box also accounts for borders and arbitrary host screen widths.
function ScaledViewport({ mode, children }: { mode: ViewMode; children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const width = mode === "desktop" ? 1200 : 390;
  const height = mode === "desktop" ? 700 : 844;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const updateScale = (renderedWidth: number) => {
      viewport.style.setProperty("--preview-scale", String(renderedWidth / width));
    };
    updateScale(Number.parseFloat(getComputedStyle(viewport).width));
    const observer = new ResizeObserver(([entry]) => updateScale(entry.contentRect.width));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      style={{
        aspectRatio: `${width} / ${height}`,
        "--preview-width": `${width}px`,
        "--preview-height": `${height}px`,
      } as CSSProperties}
    >
      {children}
    </div>
  );
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
  const accent = template.accent;

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

export function ExpressCatalogue({ amountCents = null, currency = "usd", templates, preference = {} }: { amountCents?: number | null; currency?: string; templates: ExpressTemplate[]; preference?: PurchasePreference }) {
  const industries = groupTemplates(templates);
  const [industryIndex, setIndustryIndex] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode | null>(null);
  const [replayVersion, setReplayVersion] = useState(0);
  const industryTabsRef = useRef<HTMLDivElement>(null);
  const isMobileViewport = useSyncExternalStore(
    subscribeToMobileViewport,
    getMobileViewportSnapshot,
    getServerMobileViewportSnapshot
  );
  const effectiveViewMode = viewMode ?? (isMobileViewport ? "mobile" : "desktop");

  const group = industries[industryIndex];
  const active = group.variants[variantIndex] ?? group.variants[0];
  const previousIndex = (industryIndex - 1 + industries.length) % industries.length;
  const nextIndex = (industryIndex + 1) % industries.length;
  const previous = industries[previousIndex].variants[0];
  const next = industries[nextIndex].variants[0];
  const accent = active.accent;
  const href = active.previewUrl ?? `/express-templates/${active.slug}.html`;

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
  }, [industryIndex, isMobileViewport]);

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
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.heading}>
            <p>Vigil Express</p>
            <h1 id="catalogue-title">Choose your starting point.</h1>
          </div>
          <p className={styles.description}>
            A polished single page from a curated industry design, customized with
            your brand, content and imagery. One design direction and one revision
            round; a separate recurring Vigil plan is required. First look within
            two business days of completed onboarding.
          </p>
        </header>

        <div className={styles.controls}>
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
            <div className={styles.viewSwitch} role="group" aria-label="Preview size">
              {(["desktop", "mobile"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-label={mode === "desktop" ? "Desktop" : "Mobile"}
                  aria-pressed={effectiveViewMode === mode}
                  title={`${mode === "desktop" ? "Desktop" : "Mobile"} preview`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode === "desktop" ? <Monitor size={14} /> : <Smartphone size={14} />}
                  <span className={styles.deviceLabel}>{mode === "desktop" ? "Desktop" : "Mobile"}</span>
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
            <label className={styles.variantSelect}>
              <span className={styles.variantName}>{active.variant}</span>
              {group.variants.length > 1 && <ChevronDown size={13} aria-hidden="true" />}
              <select
                aria-label={`${group.industry} variant`}
                value={variantIndex}
                disabled={group.variants.length < 2}
                onChange={(event) => {
                  const index = Number(event.target.value);
                  setDirection(index >= variantIndex ? 1 : -1);
                  setVariantIndex(index);
                }}
              >
                {group.variants.map((variant, index) => (
                  <option key={variant.slug} value={index}>{variant.variant}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={styles.replayButton}
              aria-label="Replay animations"
              title="Restart the preview and replay its animations"
              disabled={active.status === "coming"}
              onClick={() => setReplayVersion((version) => version + 1)}
            >
              <RotateCcw size={14} />
              <span>Motion</span>
            </button>
          </div>
        </div>

        <div
          id="template-stage"
          className={styles.stage}
          role="tabpanel"
          aria-labelledby={`industry-tab-${industryIndex}`}
          aria-live="polite"
        >
          <div className={styles.previewBackground} aria-hidden="true">
            <div className={styles.ambient} />
          </div>
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

                <div
                  data-cursor="native"
                  className={`${styles.browser} ${
                    effectiveViewMode === "desktop" ? styles.desktop : styles.mobile
                  }`}
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
                  <ScaledViewport mode={effectiveViewMode}>
                    {active.status === "coming" ? (
                      <div className={styles.construction} role="status">
                        <span className={styles.constructionBadge}>
                          <Hammer size={14} />
                          Under construction
                        </span>
                        <h3>{active.industry} is being built.</h3>
                        <p>
                          This design is not ready to preview or buy yet. Check
                          back soon, or ask us about a tailored Professional site for your
                          business today.
                        </p>
                      </div>
                    ) : (
                      <iframe
                        key={replayVersion}
                        src={href}
                        title={`${active.industry}, ${active.variant} preview`}
                        tabIndex={-1}
                        loading="eager"
                      />
                    )}
                  </ScaledViewport>
                </div>

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
                  {active.status === "coming" ? (
                    <>
                      <span className={styles.locked} aria-disabled="true">
                        <Lock size={15} />
                        View
                      </span>
                      <span className={`${styles.locked} ${styles.enquire}`} aria-disabled="true">
                        <Lock size={15} />
                        Coming soon
                      </span>
                    </>
                  ) : (
                    <>
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        View
                        <ArrowUpRight size={17} />
                      </a>
                      <CampaignLink href={withPurchasePreference(`/checkout?template=${active.slug}`, preference)} className={styles.enquire} placement="express_catalogue" event="creator_checkout_cta_click">
                        Buy{amountCents !== null ? ` · ${formatMoney(amountCents, currency).replace(/\.00$/, "")}` : ""}
                      </CampaignLink>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
