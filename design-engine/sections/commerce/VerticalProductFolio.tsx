import type { SectionInstance } from "../../composition/schemas";
import { CommerceShell, ProductLink, Price, num } from "./shared";
import { Picture } from "./ProductPicture";
export function VerticalProductFolio({
  id,
  content,
  treatment,
}: SectionInstance<"commerce.vertical-product-folio">) {
  const artwork = (
    <div className="de-commerce-folio">
      <div className="de-commerce-folio-record">
        <h3>{content.product.title}</h3>
        <Price product={content.product} />
        <ProductLink product={content.product} />
      </div>
      {content.plates.map((p, i) => (
        <figure key={p.id}>
          <figcaption>
            <span className="de-commerce-number">{num(i)}</span>
            <h4>{p.media.label}</h4>
            <p>{p.caption}</p>
          </figcaption>
          <Picture treatment={treatment} media={p.media} />
        </figure>
      ))}
    </div>
  );

  return (
    <CommerceShell id={id} content={content} concept="p11">
      {artwork}
    </CommerceShell>
  );
}
