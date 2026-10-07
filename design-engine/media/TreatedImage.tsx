import { MediaAsset } from "./MediaAsset";
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
      <MediaAsset asset={image} loading={priority ? "eager" : "lazy"} priority={priority}/>

    </div>
    {image.caption ? <figcaption className="de-mono">{image.caption}</figcaption> : null}
  </figure>;
}
