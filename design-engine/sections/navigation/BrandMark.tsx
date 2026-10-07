"use client";
/* eslint-disable @next/next/no-img-element -- Client-authored logo sources with text recovery. */
import { useState } from "react";
import type { z } from "zod";
import type { logoSchema } from "../../navigation/schemas";
export type NavigationLogo = z.infer<typeof logoSchema>;
export function BrandMark({
  brand,
  logo = { kind: "wordmark" },
}: {
  brand: string;
  logo?: NavigationLogo;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const hasSource = "src" in logo,
    broken = hasSource && failedSource === logo.src;
  return (
    <>
      {hasSource && !broken && (
        <img
          src={logo.src}
          width={logo.kind === "image" ? logo.width : 48}
          height={logo.kind === "image" ? logo.height : 48}
          className={
            logo.kind === "symbol" || logo.kind === "combined"
              ? "de-nx-symbol"
              : "de-brand-image"
          }
          alt={logo.kind === "image" ? brand : ""}
          onError={() => setFailedSource(logo.src)}
        />
      )}
      {(logo.kind !== "image" || broken) && (
        <span
          className={
            logo.kind === "symbol" && !broken
              ? "de-visually-hidden"
              : logo.kind === "text"
                ? "de-brand-text"
                : undefined
          }
        >
          {brand}
        </span>
      )}
    </>
  );
}
