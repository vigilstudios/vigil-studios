"use client";

import { forwardRef, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";
import styles from "./modern-hero-section.module.css";

interface HeroCollageProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  subtitle: string;
  images: string[];
  imageAlts?: string[];
  imageSrcSets?: string[];
  stats?: { value: string; label: string }[];
  eyebrow?: ReactNode;
  titleClassName?: string;
  subtitleClassName?: string;
  headingId?: string;
  collageOverlay?: ReactNode;
  footer?: ReactNode;
}

/** Adapted from the supplied seven-image component; positioning and float transforms have separate owners. */
const HeroCollage = forwardRef<HTMLElement, HeroCollageProps>(function HeroCollage({
  className, title, subtitle, images, imageAlts = [], imageSrcSets = [], stats = [], eyebrow, titleClassName, subtitleClassName,
  headingId, collageOverlay, footer, children, ...props
}, ref) {
  const collage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    if (collage.current) observer.observe(collage.current);
    return () => observer.disconnect();
  }, []);
  return <section ref={ref} className={clsx(styles.hero, className)} aria-labelledby={headingId} {...props}>
    <div className={styles.copy}>
      {eyebrow}
      <h1 id={headingId} className={clsx(styles.heading, titleClassName)}>{title}</h1>
      <p className={clsx(styles.subtitle, subtitleClassName)}>{subtitle}</p>
      {children}
    </div>
    <div ref={collage} className={styles.collage} data-creator-collage data-active={active}>
      {images.slice(0, 7).map((src, index) => <div key={src} className={styles.tile} data-collage-tile={index}>
        <div className={styles.float} data-collage-float><div className={styles.photo}>
          {/* Already optimized local WebPs; reserve the exact 3:4 aspect ratio. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} srcSet={imageSrcSets[index]} sizes={index === 0 ? "(max-width: 639px) 35vw, (max-width: 1023px) 25vw, 270px" : "(max-width: 639px) 25vw, (max-width: 1023px) 19vw, 224px"} alt={imageAlts[index] ?? ""} width={600} height={800} loading={index === 0 ? "eager" : "lazy"} decoding="async" fetchPriority={index === 0 ? "high" : "low"} draggable={false} />
        </div></div>
      </div>)}
      {collageOverlay}
    </div>
    {stats.length > 0 ? <div className={styles.stats}>{stats.map(stat => <div key={stat.label}><strong>{stat.value}</strong><p>{stat.label}</p></div>)}</div> : null}
    {footer}
  </section>;
});

export { HeroCollage };
