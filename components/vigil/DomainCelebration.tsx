"use client";

import { useEffect, useState, type CSSProperties } from "react";
import styles from "./DomainCelebration.module.css";

/** Decorative, once per fully connected domain. Ownership alone is unfinished. */
export function DomainCelebration({ domainId }: { domainId: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let end: number | undefined;
    const start = window.setTimeout(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const key = `vigil:domain-celebration:v1:${domainId}:connected`;
      try { if (window.localStorage.getItem(key)) return; window.localStorage.setItem(key, "shown"); } catch { /* Celebration is optional. */ }
      setVisible(true);
      end = window.setTimeout(() => setVisible(false), 2800);
    }, 0);
    return () => { window.clearTimeout(start); window.clearTimeout(end); };
  }, [domainId]);
  return visible ? <div aria-hidden="true" className={styles.burst}>{Array.from({ length: 18 }, (_, i) => <span key={i} className={styles.piece} style={{ "--x": `${4 + i * 5.2}%`, "--delay": `${(i % 4) * .08}s`, "--drift": `${(i % 2 ? 1 : -1) * (12 + i * 2)}px`, "--turn": `${180 + i * 37}deg` } as CSSProperties} />)}</div> : null;
}
