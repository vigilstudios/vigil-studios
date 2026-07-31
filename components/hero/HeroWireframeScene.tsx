"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { WireframeWebsite, type WireframeVariant } from "./WireframeWebsite";

type HeroWireframeSceneProps = {
  buildProgress: MotionValue<number>;
  reducedMotion: boolean;
  variant: WireframeVariant;
};

function readThemeColors() {
  if (typeof window === "undefined") {
    return { line: "#f5f5f3", accent: "#10d45a" };
  }
  const styles = getComputedStyle(document.documentElement);
  return {
    line: styles.getPropertyValue("--text-primary").trim() || "#f5f5f3",
    accent: styles.getPropertyValue("--accent").trim() || "#10d45a",
  };
}

export default function HeroWireframeScene({
  buildProgress,
  reducedMotion,
  variant,
}: HeroWireframeSceneProps) {
  const [colors, setColors] = useState(readThemeColors);

  useEffect(() => {
    const handleThemeChange = () => setColors(readThemeColors());
    window.addEventListener("site-theme-change", handleThemeChange);
    return () => window.removeEventListener("site-theme-change", handleThemeChange);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.75]}
      style={{ background: "transparent" }}
    >
      <WireframeWebsite
        buildProgress={buildProgress}
        reducedMotion={reducedMotion}
        colors={colors}
        variant={variant}
      />
    </Canvas>
  );
}
