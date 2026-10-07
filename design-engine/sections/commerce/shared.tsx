import { SectionActions, ItemAction } from "../../actions/SectionActions";
import type { ReactNode } from "react";
import type {
  ProductSummary,
  ProductIdentity,
  Money,
} from "../../commerce/types";
import { formatMoney, availabilityText } from "../../commerce/presentation";
export const num = (i: number) => String(i + 1).padStart(2, "0");
export function CommerceShell({
  id,
  content,
  concept,
  children,
}: {
  id: string;
  content: { eyebrow?: string; title: string; introduction: string };
  concept: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`de-commerce de-commerce-${concept}`}
      aria-labelledby={`${id}-title`}
    >
      <header className="de-commerce-heading">
        {content.eyebrow && (
          <p className="de-commerce-kicker">{content.eyebrow}</p>
        )}
        <h2 id={`${id}-title`}>{content.title}</h2>
        <p className="de-commerce-introduction">{content.introduction}</p>
      </header>
      {children}
      <SectionActions/>
    </section>
  );
}
export function Price({
  product,
}: {
  product: { price: Money; compareAtPrice?: Money };
}) {
  return (
    <p className="de-commerce-price">
      {product.compareAtPrice ? (
        <>
          <span className="de-commerce-sr-only">Previous price </span>
          <del>{formatMoney(product.compareAtPrice)}</del>
          <span className="de-commerce-sr-only"> Sale price </span>
        </>
      ) : (
        <span className="de-commerce-sr-only">Price </span>
      )}
      <span>{formatMoney(product.price)}</span>
      <small>{product.price.currency}</small>
    </p>
  );
}
export function Availability({
  product,
}: {
  product: Pick<ProductSummary, "availability">;
}) {
  return (
    <span
      className={`de-commerce-availability de-commerce-availability--${product.availability}`}
    >
      {availabilityText[product.availability]}
    </span>
  );
}
export function ProductLink({ product, children }: { product: Pick<ProductIdentity, "productId" | "title" | "destination">; children?: ReactNode }) {
  return <ItemAction itemId={product.productId} fallback={product.destination} className="de-commerce-product-link">{children}</ItemAction>;
}
export function ProductRecord({
  product,
  description = false,
}: {
  product: ProductSummary;
  description?: boolean;
}) {
  return (
    <div className="de-commerce-record">
      {(product.category || product.badges.length > 0) && (
        <small>
          {[product.category, ...product.badges].filter(Boolean).join(" / ")}
        </small>
      )}
      <h3>{product.title}</h3>
      {description && product.description && <p>{product.description}</p>}
      <Price product={product} />
      <Availability product={product} />
      <ProductLink product={product} />
    </div>
  );
}
