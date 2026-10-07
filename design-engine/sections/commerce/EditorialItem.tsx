import type { MediaTreatment } from "../../media/types";
import type { ProductSummary } from "../../commerce/types";
import { primaryMedia } from "../../commerce/presentation";
import { Picture } from "./ProductPicture";
import { ProductRecord } from "./shared";
export function EditorialItem({
  product,
  note,
  treatment,
}: {
  product: ProductSummary;
  note: string;
  treatment?: MediaTreatment;
}) {
  return (
    <article className="de-commerce-editorial-item">
      <Picture treatment={treatment} media={primaryMedia(product)} />
      <p className="de-commerce-item-note">{note}</p>
      <ProductRecord product={product} />
    </article>
  );
}
