import type { SectionInstance } from "../../composition/schemas";
import { ItemAction, ActionMedia } from "../../actions/SectionActions";
import { CommerceShell, num } from "./shared";
import { Picture } from "./ProductPicture";
export function CollectionAtlas({
  id,
  content,
  treatment,
}: SectionInstance<"commerce.collection-atlas">) {
  const artwork = (
    <div className="de-commerce-atlas">
      {content.collections.map((c, i) => (
        <article key={c.id}>
          <div className="de-commerce-atlas-title">
            <small>
              {num(i)} / {c.productCount} objects
            </small>
            <h3>
              <ItemAction heading group="collections" itemId={c.id} fallback={c.destination}>{c.title}</ItemAction>
            </h3>
            <p>{c.description}</p>
          </div>
          <ActionMedia group="collections" itemId={c.id}><Picture treatment={treatment} media={c.media} /></ActionMedia>
        </article>
      ))}
    </div>
  );

  return (
    <CommerceShell id={id} content={content} concept="p05">
      {artwork}
    </CommerceShell>
  );
}
