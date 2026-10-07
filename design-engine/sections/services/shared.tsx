import { SectionActions, ItemAction } from "../../actions/SectionActions";
import type { ReactNode } from "react";
import type { SectionImage, MediaTreatment } from "../../media/types";
import type { ServiceContent } from "../../composition/service-schemas";
import { MediaReveal } from "../../motion/MediaReveal";
export const number = (i: number) => String(i + 1).padStart(2, "0");
export function ServiceShell({
  id,
  content,
  concept,
  children,
}: {
  id: string;
  content: { eyebrow?: string; title: string; introduction: string };
  concept: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`de-service de-service-${concept}`}
      aria-labelledby={`${id}-title`}
    >
      <header className="de-service-heading">
        {content.eyebrow && (
          <p className="de-service-kicker">{content.eyebrow}</p>
        )}
        <h2 id={`${id}-title`}>{content.title}</h2>
        <p className="de-service-introduction">{content.introduction}</p>
      </header>
      {children}
      <SectionActions/>
    </section>
  );
}
export function ServiceLink({ destination, itemId }: { destination?: {label:string;href:string}; itemId: string }) {
  return <ItemAction itemId={itemId} fallback={destination} className="de-service-detail-link"/>;
}
export function ServicePicture({
  image,
  treatment,
  motion,
}: {
  image: SectionImage;
  treatment: MediaTreatment;
  motion: "none" | "media-reveal";
}) {
  const plate = (
    <picture
      className={`de-service-picture de-service-picture--${treatment.tone}`}
    >
      {image.mobileSrc && (
        <source media="(max-width:700px)" srcSet={image.mobileSrc} />
      )}
      <img
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        srcSet={image.srcSet}
        sizes={image.sizes}
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
  return motion === "media-reveal" ? (
    <MediaReveal duration={0.6}>{plate}</MediaReveal>
  ) : (
    plate
  );
}
export function CapabilityMatrix({
  content,
  phase,
}: {
  content: ServiceContent<"services.capability-coverage">;
  phase?: number;
}) {
  const columns = content.phases
    .map((label, index) => ({ label, index }))
    .filter((c) => phase === undefined || c.index === phase);
  return (
    <table>
      <caption>Capability coverage by phase</caption>
      <thead>
        <tr>
          <th scope="col">Discipline / capability</th>
          {columns.map((c) => (
            <th key={c.index} scope="col">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      {content.groups.map((g) => (
        <tbody key={g.name}>
          <tr className="de-service-group-row">
            <th colSpan={columns.length + 1} scope="rowgroup">
              {g.name}
            </th>
          </tr>
          {g.capabilities.map((c) => (
            <tr key={c.id}>
              <th scope="row">{c.title}</th>
              {columns.map((p) => (
                <td key={p.index} data-coverage={c.coverage[p.index]}>
                  {c.coverage[p.index]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  );
}
