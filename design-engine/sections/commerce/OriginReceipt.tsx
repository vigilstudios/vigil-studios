import type { SectionInstance } from "../../composition/schemas";
import { primaryMedia } from "../../commerce/presentation";
import { CommerceShell, ProductRecord, num } from "./shared";
import { Picture } from "./ProductPicture";
export function OriginReceipt({
  id,
  content,
  treatment,
}: SectionInstance<"commerce.origin-receipt">) {
  const artwork = (
    <div className="de-commerce-origin">
      <div className="de-commerce-origin-object">
        <Picture treatment={treatment} media={primaryMedia(content.product)} />
        <ProductRecord product={content.product} />
      </div>
      <ol>
        {content.stages.map((s, i) => (
          <li key={s.id}>
            <div className="de-commerce-origin-marker">
              <span>{num(i)}</span>
              <small>{s.place}</small>
            </div>
            <div>
              <h3>{s.title}</h3>
              <p>{s.story}</p>
              <small className="de-commerce-evidence">{s.evidence}</small>
              {s.media && (
                <figure>
                  <Picture treatment={treatment} media={s.media} />
                  <figcaption>{s.mediaCaption ?? s.media?.label}</figcaption>
                </figure>
              )}
            </div>
          </li>
        ))}
      </ol>
      <footer>Object record / {content.product.productId}</footer>
    </div>
  );

  return (
    <CommerceShell id={id} content={content} concept="p09">
      {artwork}
    </CommerceShell>
  );
}
