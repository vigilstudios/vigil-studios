"use client";

import { useEffect, useState } from "react";

export function AnimatedGridBackground() {
  const [cursor, setCursor] = useState({ x: "50%", y: "50%" });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursor({
        x: `${e.clientX}px`,
        y: `${e.clientY}px`,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none grid-reveal"
      style={{
        ["--cursor-x" as string]: cursor.x,
        ["--cursor-y" as string]: cursor.y,
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[--accent]/10 to-transparent opacity-30" />

      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 1200 800">
        <defs>
          <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>

          <radialGradient id="gridFade" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="45%" stopColor="white" stopOpacity="0.65" />
            <stop offset="75%" stopColor="white" stopOpacity="0.35" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          <mask id="gridMask">
            <rect width="1200" height="800" fill="url(#gridFade)" />
          </mask>
        </defs>

        <rect width="1200" height="800" fill="url(#grid)" mask="url(#gridMask)" />
      </svg>
    </div>
  );
}