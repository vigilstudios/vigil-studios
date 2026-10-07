import type { SectionInstance } from "../../composition/schemas";
import { SceneMedia, SceneActions } from "./scene-shared";
/** HX01: grouped introduction over one continuous scene, with edge provenance. */
export function FullSceneHero(section: SectionInstance<"hero.full-scene">) {
  const { id, content: c, alignment, position, voice, ink } = section;
  return (
    <section
      id={id}
      className="de-production-hero hx-hero hx-scene"
      data-align={alignment}
      data-position={position}
      data-voice={voice}
      data-ink={ink}
      aria-labelledby={`${id}-title`}
    >
      <SceneMedia section={section} />
      {c.reference && (
        <div className="hx-scene-meta">
          <span>{c.reference}</span>
        </div>
      )}
      <div className="hx-title-field">
        <div className="hx-copy">
          {c.eyebrow && <p className="hx-eyebrow">{c.eyebrow}</p>}
          <h1 id={`${id}-title`}>{c.title}</h1>
          {c.description && <p className="hx-description">{c.description}</p>}
          <SceneActions content={c} />
        </div>
      </div>
      {c.caption && <p className="hx-scene-caption">{c.caption}</p>}
    </section>
  );
}
