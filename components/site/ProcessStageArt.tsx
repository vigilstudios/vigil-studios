"use client";

import { useEffect, useRef, useState } from "react";
import { ProcessObject } from "./ProcessObjects";
import type { journeyStages } from "./journey-stages";
import styles from "./field-guide.module.css";

export function ProcessStageArt({ stage }: { stage: (typeof journeyStages)[number]["name"] }) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.45 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={host} className={styles.stageArt}><ProcessObject stage={stage} active={visible} /></div>;
}
