"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Variants } from "framer-motion";
import { useViewportMotion } from "./motion-runtime";

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};
const initial = { opacity: 0, transform: "translateY(24px)" };
const Group = createContext<
  ReturnType<typeof useViewportMotion>["loaded"] | undefined
>(undefined);

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, loaded } = useViewportMotion();
  return loaded ? (
    <loaded.Reveal hostRef={ref} className={className} delay={delay}>
      {children}
    </loaded.Reveal>
  ) : (
    <div ref={ref} className={className} style={initial}>
      {children}
    </div>
  );
}

export function RevealGroup({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol";
}) {
  const { ref, loaded } = useViewportMotion();
  const Tag = as;
  return (
    <Group.Provider value={loaded}>
      {loaded ? (
        <loaded.RevealGroup hostRef={ref} className={className} as={as}>
          {children}
        </loaded.RevealGroup>
      ) : (
        <Tag ref={ref} className={className}>
          {children}
        </Tag>
      )}
    </Group.Provider>
  );
}

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const loaded = useContext(Group),
    Tag = as;
  return loaded ? (
    <loaded.RevealItem className={className} as={as}>
      {children}
    </loaded.RevealItem>
  ) : (
    <Tag className={className} style={loaded === null ? initial : undefined}>
      {children}
    </Tag>
  );
}
