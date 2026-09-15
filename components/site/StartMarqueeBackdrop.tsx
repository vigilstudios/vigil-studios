"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";

function shuffle<T>(list: T[]): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Client-only (see StartMarquee): a fresh shuffle every visit. */
export function StartMarqueeBackdrop({ images }: { images: string[] }) {
  const [order] = useState(() => shuffle(images));
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, ease: "easeOut" }} className="absolute inset-0">
      <ThreeDMarquee images={order} columns={4} className="h-full max-xl:h-full max-sm:h-full rounded-none" planeClassName="size-[1400px] scale-[1.15] max-xl:size-[1100px] max-xl:scale-[1.2] max-sm:size-[900px] max-sm:scale-[1.3]" />
    </motion.div>
  );
}
