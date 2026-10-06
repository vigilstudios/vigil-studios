"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "@/app/(site)/creators/creators.module.css";

/** Content stays readable without JavaScript; entrance motion never gates interaction. */
export function CreatorMotion({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setEntered(true); observer.disconnect(); }
    }, { threshold: .12 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`${styles.reveal} ${className}`} data-creator-reveal data-entered={entered} style={{ animationDelay: `${delay}s` }}>{children}</div>;
}
