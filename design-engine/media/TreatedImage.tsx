import type { CSSProperties } from "react";
import type { MediaTreatment, SectionImage } from "./types";

/** Geometry is explicit: art tendencies cannot invalidate a structural crop. */
export function TreatedImage({ image, treatment, priority = false, className = "" }: {
  image: SectionImage; treatment: MediaTreatment; priority?: boolean; className?: string;
}) {
  const position = (f: SectionImage["focal"]) => f ? `${f.x}% ${f.y}%` : "50% 50%";
  return <figure className={`de-treated de-treated--${treatment.geometry} ${className}`} style={{
    "--de-focal": position(image.focal), "--de-mobile-focal": position(image.mobileFocal ?? image.focal),
  } as CSSProperties}>
    <div className={`de-treated__frame de-treated__frame--${treatment.tone}`}>
      <picture>
        {image.mobileSrc ? <source media="(max-width: 700px)" srcSet={image.mobileSrc} /> : null}
        {/* Native markup keeps client image hosting/optimization at the app boundary. */}
        <img src={image.src} alt={image.alt} width={image.width} height={image.height} srcSet={image.srcSet} sizes={image.sizes}
          loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" />
      </picture>
    </div>
    {image.caption ? <figcaption className="de-mono">{image.caption}</figcaption> : null}
  </figure>;
}
