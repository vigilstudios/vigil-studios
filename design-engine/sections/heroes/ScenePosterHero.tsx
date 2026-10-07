import type { SectionInstance } from "../../composition/schemas";
import { SceneMedia, SceneActions } from "./scene-shared";
/** HX02: independent headline field above a separate bottom context register. */
export function ScenePosterHero(section: SectionInstance<"hero.scene-poster">) {
  const { id, content: c, alignment, position, voice, ink } = section;
  return (
    <section
      id={id}
      className="de-production-hero hx-hero hx-poster"
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
        </div>
      </div>
      {(c.caption || c.description || c.action || c.secondaryAction || section.contextualActions?.primary || section.contextualActions?.secondary) && (
        <div className="hx-poster-context">
          {c.caption && <p className="hx-caption">{c.caption}</p>}
          {c.description && <p className="hx-description">{c.description}</p>}
          <SceneActions content={c} />
        </div>
      )}
    </section>
  );
}
