"use client";

import { createContext, useContext, type ReactNode } from "react";
import { clsx } from "clsx";
import {
  loadMotionRuntime,
  useMotionRuntime,
  useMotionHost,
  useViewportMotion,
} from "./motion-runtime";

const Cards = createContext<
  ReturnType<typeof useViewportMotion>["loaded"] | undefined
>(undefined);
const rowClass =
  "scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pt-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:overflow-visible md:px-0 md:pb-0 md:pt-0";
const cardClass =
  "w-[82%] max-w-[320px] shrink-0 snap-center md:w-auto md:max-w-none md:shrink";

export function CardRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { ref, loaded } = useViewportMotion();
  return (
    <Cards.Provider value={loaded}>
      {loaded ? (
        <loaded.CardRow hostRef={ref} className={className}>
          {children}
        </loaded.CardRow>
      ) : (
        <div ref={ref} className={clsx(rowClass, className)}>
          {children}
        </div>
      )}
    </Cards.Provider>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { ref } = useMotionHost();
  const context = useContext(Cards),
    shared = useMotionRuntime();
  const loaded = context === undefined ? shared : context;
  return loaded ? (
    <loaded.Card hostRef={ref} className={className}>
      {children}
    </loaded.Card>
  ) : (
    <div
      ref={ref}
      className={clsx(cardClass, className)}
      style={
        context === null
          ? { opacity: 0, transform: "translateY(18px)" }
          : undefined
      }
      onPointerEnter={
        context === undefined
          ? () => {
              void loadMotionRuntime().catch(() => {});
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
