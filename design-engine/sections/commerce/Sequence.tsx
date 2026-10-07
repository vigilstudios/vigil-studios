"use client";
import { useRef, useId, type ReactNode } from "react";
import { VigilIcon } from "../../icons/VigilIcon";
export function Sequence({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const rail = useRef<HTMLDivElement>(null),
    uid = useId();
  return (
    <>
      <div className="de-commerce-sequence-controls">
        <span>{label} · scroll to explore</span>
        <div>
          <button
            type="button"
            aria-label={`Previous ${label}`}
            aria-controls={uid}
            onClick={() =>
              rail.current?.scrollBy({
                left: -rail.current.clientWidth * 0.85,
                behavior: "instant",
              })
            }
          >
            <VigilIcon decorative name="arrow-left" size={20} />
          </button>
          <button
            type="button"
            aria-label={`Next ${label}`}
            aria-controls={uid}
            onClick={() =>
              rail.current?.scrollBy({
                left: rail.current.clientWidth * 0.85,
                behavior: "instant",
              })
            }
          >
            <VigilIcon decorative name="arrow-right" size={20} />
          </button>
        </div>
      </div>
      <div
        id={uid}
        className="de-commerce-sequence"
        ref={rail}
        tabIndex={0}
        role="region"
        aria-label={label}
      >
        {children}
      </div>
    </>
  );
}
