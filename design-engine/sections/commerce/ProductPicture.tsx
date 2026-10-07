"use client";
// Portable media delivery stays at the host application boundary.
import { MediaAsset } from "../../media/MediaAsset";
import { SectionVideoPlayer } from "../../media/VideoPlayer";
import { useState, type CSSProperties } from "react";
import type { ProductMedia } from "../../commerce/types";
import type { MediaTreatment } from "../../media/types";
/** Whole-object geometry is intentional; responsive candidates are authored/optimized by the host. */
export function Picture({
  media,
  compact = false,
  treatment = { geometry: "contained", tone: "natural" },
}: {
  media?: ProductMedia;
  compact?: boolean;
  treatment?: MediaTreatment;
}) {
  const image = media?.kind === "video" ? media.video.poster : media?.image;
  const source = compact ? (media?.thumbnail ?? image) : image;
  const key =
    media?.kind === "video" && !compact ? media.video.src : source?.src;
  const [failedSource, setFailed] = useState<string>();
  if (!media || !source || key === failedSource)
    return (
      <div
        className="de-commerce-missing"
        role="img"
        aria-label={`${media?.label ?? "Product image"} — unavailable`}
      >
        <span aria-hidden="true">↗</span>
        <p>{media?.label ?? "Product image not supplied"}</p>
        <small>Media unavailable</small>
      </div>
    );
  if (media.kind === "video" && !compact)
    return (
      <div className="de-commerce-film">
        <SectionVideoPlayer key={key} video={media.video}/>

      </div>
    );
  const position = (f: typeof source.focal) =>
    f ? `${f.x}% ${f.y}%` : "50% 50%";
  return (
    <div
      className={`de-commerce-picture de-commerce-picture--${treatment.tone} ${media.kind === "interactive-placeholder" ? "de-commerce-placeholder" : ""}`}
      style={
        {
          "--commerce-focal": position(source.focal),
          "--commerce-mobile-focal": position(
            source.mobileFocal ?? source.focal,
          ),
          "--commerce-ratio": `${source.width}/${source.height}`,
        } as CSSProperties
      }
    >
      <MediaAsset key={key} asset={source} preview={compact} sizes={compact ? "160px" : "(max-width: 700px) 90vw, 60vw"} onError={() => setFailed(key)}/>

      {media.kind === "interactive-placeholder" && !compact && (
        <p>
          <strong>360° · static view</strong>
          <br />
          {media.explanation}
        </p>
      )}
    </div>
  );
}
