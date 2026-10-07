import type { SectionInstance } from "../../composition/schemas";
import { primaryMedia } from "../../commerce/presentation";
import { CommerceShell, ProductRecord, ProductLink, num } from "./shared";
import { Picture } from "./ProductPicture";
import { Sequence } from "./Sequence";
export function CompanionRail({
  id,
  content,
  treatment,
}: SectionInstance<"commerce.companion-rail">) {
  const artwork = (
    <div className="de-commerce-companions">
      <div className="de-commerce-anchor">
        <small>Begin with</small>
        <h3>{content.anchor.title}</h3>
        <p>{content.anchor.description}</p>
        <ProductLink product={content.anchor} />
      </div>
      <Sequence label="Companion products">
        {content.relatedProducts.map((p, i) => (
          <article className="de-commerce-companion" key={p.product.productId}>
            <small>
              {num(i)} / {p.relationship}
            </small>
            <p>{p.reason}</p>
            <Picture treatment={treatment} media={primaryMedia(p.product)} />
            <ProductRecord product={p.product} />
          </article>
        ))}
      </Sequence>
    </div>
  );
  return (
    <CommerceShell id={id} content={content} concept="p14">
      {artwork}
    </CommerceShell>
  );
}
