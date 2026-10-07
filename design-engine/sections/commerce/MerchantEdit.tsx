import type { SectionInstance } from "../../composition/schemas";
import { CommerceShell } from "./shared";
import { EditorialItem } from "./EditorialItem";
export function MerchantEdit({
  id,
  content,
  treatment,
}: SectionInstance<"commerce.merchant-edit">) {
  const artwork = (
    <div className="de-commerce-edit">
      <EditorialItem treatment={treatment} {...content.items[0]} />
      <aside>
        <p className="de-commerce-editor-note">{content.editorialNote}</p>
        <div className="de-commerce-edit-support">
          {content.items.slice(1).map((item) => (
            <EditorialItem
              treatment={treatment}
              key={item.product.productId}
              {...item}
            />
          ))}
        </div>
      </aside>
    </div>
  );

  return (
    <CommerceShell id={id} content={content} concept="p01">
      {artwork}
    </CommerceShell>
  );
}
