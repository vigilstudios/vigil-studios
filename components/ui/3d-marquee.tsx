"use client";

/**
 * 3D marquee (emerald-ui, MIT): columns of images on a tilted plane, each
 * column drifting slowly up or down. Adapted for Vigil: next/image, the
 * site's surface token instead of neutral greys, a still plane under
 * prefers-reduced-motion, and a `columns` prop so a full-bleed backdrop can
 * use more than three.
 */
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { clsx } from "clsx";

export interface ThreeDMarqueeProps {
  images: string[];
  className?: string;
  /** Class for the square plane that holds the grid; sets its size and scale. */
  planeClassName?: string;
  columns?: number;
}

export function ThreeDMarquee({ images, className, planeClassName, columns = 3 }: ThreeDMarqueeProps) {
  const still = useReducedMotion();
  const chunkSize = Math.ceil(images.length / columns);
  const chunks = Array.from({ length: columns }, (_, colIndex) => images.slice(colIndex * chunkSize, (colIndex + 1) * chunkSize));

  return (
    <div className={clsx("mx-auto block h-140 w-full overflow-hidden rounded-md max-xl:h-120 max-sm:h-100", className)}>
      <div className="flex size-full items-center justify-center">
        <div className={clsx("aspect-square shrink-0", planeClassName ?? "size-180 scale-135 max-xl:size-full max-xl:scale-110 max-sm:scale-130")}>
          <div
            style={{ transform: "rotateX(45deg) rotateY(0deg) rotateZ(45deg)", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            className="relative top-0 right-[-55%] grid size-full origin-top-left gap-5 transform-3d max-xl:-top-30 max-xl:right-[-45%] max-sm:top-0 max-sm:gap-2"
          >
            {chunks.map((subarray, colIndex) => (
              <motion.figure
                animate={still ? undefined : { y: colIndex % 2 === 0 ? 60 : -60 }}
                transition={{ duration: colIndex % 2 === 0 ? 10 : 15, repeat: Infinity, repeatType: "reverse" }}
                key={colIndex + "marquee"}
                className="flex flex-col items-start gap-6 max-sm:gap-3"
              >
                {subarray.map((src, imageIndex) => (
                  <div className="relative" key={imageIndex + src}>
                    <Image
                      className="aspect-4/3 h-full w-full rounded-lg bg-[color:var(--bg-surface)] object-cover select-none"
                      src={src}
                      width={768}
                      height={576}
                      sizes="(max-width: 640px) 50vw, 33vw"
                      draggable={false}
                      alt=""
                    />
                  </div>
                ))}
              </motion.figure>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThreeDMarquee;
