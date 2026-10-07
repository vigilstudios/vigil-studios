import type { SectionInstance } from "../../composition/schemas";
import { primaryMedia } from "../../commerce/presentation";
import { CommerceShell, ProductRecord } from "./shared";
import { Picture } from "./ProductPicture";
export function ObjectPedestal({
  id,
  content,
  treatment,
}: SectionInstance<"commerce.object-pedestal">) {
  const artwork = (
    <div className="de-commerce-pedestal">
      <p className="de-commerce-edition">{content.edition}</p>
      <div className="de-commerce-object">
        <Picture treatment={treatment} media={primaryMedia(content.product)} />
      </div>
      <dl>
        {content.specifications.map((s) => (
          <div key={s.id}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
      <ProductRecord product={content.product} description />
    </div>
  );

  return (
    <CommerceShell id={id} content={content} concept="p03">
      {artwork}
    </CommerceShell>
  );
}
