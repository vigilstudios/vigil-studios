import type { SectionInstance } from "../../composition/schemas";
import { CommerceShell, ProductLink, Price, Availability } from "./shared";
import { Picture } from "./ProductPicture";
export function ReleaseSignal({
  id,
  content,
  treatment,
}: SectionInstance<"commerce.release-signal">) {
  const artwork = (
    <div className="de-commerce-release">
      <h3>{content.statement}</h3>
      <Picture treatment={treatment} media={content.campaignMedia} />
      <div className="de-commerce-release-strip">
        <p>{content.release}</p>
        <h4>{content.product.title}</h4>
        <Price product={content.product} />
        <Availability product={content.product} />
        <ProductLink product={content.product} />
      </div>
    </div>
  );

  return (
    <CommerceShell id={id} content={content} concept="p04">
      {artwork}
    </CommerceShell>
  );
}
