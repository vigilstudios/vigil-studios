"use client";

import { useState, type ComponentProps } from "react";
import { retainAssetPreview } from "@/lib/vigil/asset-preview";

/** Re-signing a private URL must not download an unchanged original again. */
export function AssetPreviewImage({ src, alt, ...props }: Omit<ComponentProps<"img">, "src" | "alt"> & { src: string; alt: string }) {
  const [preview, setPreview] = useState(() => ({ incoming: src, displayed: src }));
  if (preview.incoming !== src) {
    // Conditional prop reconciliation preserves the image through RSC refreshes.
    setPreview({ incoming: src, displayed: retainAssetPreview(preview.displayed, src) });
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- authorized private URL or a local upload object URL
    <img {...props} alt={alt} src={preview.displayed} loading={props.loading ?? "lazy"} decoding="async" onError={(event) => {
      // A retained link can expire before a lazy image is first viewed.
      if (preview.displayed !== src) setPreview({ incoming: src, displayed: src });
      props.onError?.(event);
    }} />
  );
}
