"use client";

import { useEffect, useState } from "react";
import Velaris, { DEFAULT_COLORS } from "@/components/ui/velaris";

/**
 * The Velaris field, coloured for Vigil and for the current theme. Dark:
 * the component's greens on black. Light: the same greens over a pale
 * ground so the words stay readable. Green leads; a touch of teal and
 * violet keeps it from being one flat colour.
 */
const DARK = { bg: "#050806", colors: ["#6ee7a5", "#22c55e", "#0b7a3e", "#1e2a4a"] };
const LIGHT = { bg: "#e4f9ec", colors: ["#bff3d4", "#7be5aa", "#1e8846", "#b9c4ff"] };

export function VelarisBackground({ className, grain = 0.3, speed = 1.6 }: { className?: string; grain?: number; speed?: number }) {
  const [light, setLight] = useState(false);
  useEffect(() => {
    const apply = () => setLight(document.documentElement.getAttribute("data-theme") === "light");
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  const palette = light ? LIGHT : DARK;
  return (
    <div className={className} aria-hidden>
      <Velaris bg={palette.bg} colors={palette.colors ?? DEFAULT_COLORS} grain={grain} speed={speed} height="100%" />
    </div>
  );
}
