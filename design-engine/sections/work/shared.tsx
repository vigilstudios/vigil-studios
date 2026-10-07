import { SectionActions, ItemAction } from "../../actions/SectionActions";
/* Native delivery is portable; hosts provide responsive sources and optimization. */
import type { CSSProperties, ReactNode } from "react";
import type { SectionImage } from "../../media/types";
import type { PhotoRecord } from "../../composition/collection-schemas";
export const number = (i: number) => String(i + 1).padStart(2, "0");
export function Plate({
  image,
  thumbnail = false,
  loading = "lazy",
}: {
  image: SectionImage;
  thumbnail?: boolean;
  loading?: "eager" | "lazy";
}) {
  return (
    <picture
      style={
        {
          "--de-work-focal": `${image.focal?.x ?? 50}% ${image.focal?.y ?? 50}%`,
          "--de-work-mobile-focal": `${image.mobileFocal?.x ?? image.focal?.x ?? 50}% ${image.mobileFocal?.y ?? image.focal?.y ?? 50}%`,
        } as CSSProperties
      }
    >
      {image.mobileSrc ? (
        <source media="(max-width: 700px)" srcSet={image.mobileSrc} />
      ) : null}
      <img
        className="de-work-image"
        src={image.src}
        srcSet={image.srcSet}
        sizes={
          image.sizes ??
          (thumbnail
            ? "(max-width: 600px) 25vw, 15vw"
            : "(max-width: 700px) 100vw, 80vw")
        }
        alt={thumbnail ? "" : image.alt}
        width={image.width}
        height={image.height}
        loading={loading}
        decoding="async"
      />
    </picture>
  );
}
export function Caption({
  record,
  index,
}: {
  record: PhotoRecord;
  index: number;
}) {
  return (
    <figcaption>
      <span className="de-mono">
        {number(index)} / {record.category}
      </span>
      <h3 className="de-heading">{record.title}</h3>
      {record.note ? <p className="de-text">{record.note}</p> : null}
      <ItemAction itemId={record.id}/>
      {record.image.caption ? (
        <p className="de-mono">{record.image.caption}</p>
      ) : null}
    </figcaption>
  );
}
export function WorkSection({
  id,
  code,
  content,
  children,
}: {
  id: string;
  code: string;
  content: { title: string; introduction: string; edition?: string };
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`de-work de-work--${code}`}
      aria-labelledby={`${id}-title`}
    >
      <header className="de-work-title">
        {content.edition ? (
          <p className="de-accent">{content.edition}</p>
        ) : null}
        <h2 id={`${id}-title`} className="de-display">
          {content.title}
        </h2>
        <p className="de-text">{content.introduction}</p>
      </header>
      {children}
      <SectionActions/>
    </section>
  );
}
export function Pagination({
  active,
  count,
  label,
  onChange,
}: {
  active: number;
  count: number;
  label: string;
  onChange: (index: number) => void;
}) {
  return (
    <div className="de-work-pagination" role="group" aria-label={label}>
      <button
        type="button"
        disabled={active === 0}
        onClick={() => onChange(active - 1)}
        aria-label={`Previous ${label}`}
      >
        ← Previous
      </button>
      <span className="de-mono" role="status" aria-live="polite">
        {number(active)} / {String(count).padStart(2, "0")}
      </span>
      <button
        type="button"
        disabled={active === count - 1}
        onClick={() => onChange(active + 1)}
        aria-label={`Next ${label}`}
      >
        Next →
      </button>
    </div>
  );
}
