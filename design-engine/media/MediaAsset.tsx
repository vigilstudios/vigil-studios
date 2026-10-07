import type { CSSProperties } from "react";
import type { SectionImage } from "./types";
import { isVideoAsset } from "./source";
import { VideoPlayer } from "./VideoPlayer";
/** All production image slots use this delivery boundary. Existing pictures keep their responsive markup. */
export function MediaAsset({
  asset,
  className = "",
  imageClassName = "",
  style,
  preview = false,
  loading = "lazy",
  sizes,
  priority = false,
  onError,
}: {
  asset: SectionImage;
  className?: string;
  imageClassName?: string;
  style?: CSSProperties;
  preview?: boolean;
  loading?: "eager" | "lazy";
  sizes?: string;
  priority?: boolean;
  onError?: () => void;
}) {
  if (isVideoAsset(asset))
    return (
      <VideoPlayer
        key={asset.src}
        asset={asset}
        className={className}
        imageClassName={imageClassName}
        style={style}
        preview={preview}
        onError={onError}
      />
    );
  return (
    <picture className={className} style={style}>
      {asset.mobileSrc && (
        <source media="(max-width:700px)" srcSet={asset.mobileSrc} />
      )}
      <img
        className={imageClassName}
        src={asset.src}
        alt={preview ? "" : asset.alt}
        width={asset.width}
        height={asset.height}
        srcSet={asset.srcSet}
        sizes={asset.sizes ?? sizes}
        loading={loading}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        onError={onError}
      />
    </picture>
  );
}
