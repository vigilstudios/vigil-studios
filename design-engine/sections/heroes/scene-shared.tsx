import { SectionActions } from "../../actions/SectionActions";
import { TreatedImage } from "../../media/TreatedImage";
import type { SectionInstance } from "../../composition/schemas";
export type SceneSection = SectionInstance<
  "hero.full-scene" | "hero.scene-poster"
>;
export function SceneMedia({ section }: { section: SceneSection }) {
  return (
    <>
      <div className="hx-image">
        <TreatedImage
          image={section.media.image}
          treatment={section.treatment}
          priority
        />
      </div>
      <div className="hx-shade" aria-hidden="true" />
    </>
  );
}
export function SceneActions({ content: c }: { content: SceneSection["content"] }) {
  return <SectionActions primary={c.action} secondary={c.secondaryAction} className="hx-actions"/>;
}
