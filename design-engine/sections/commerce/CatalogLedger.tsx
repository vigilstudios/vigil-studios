"use client";
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import type { CatalogBinding, CatalogQuery } from "../../commerce/catalog";
import { primaryMedia } from "../../commerce/presentation";
import { VigilIcon } from "../../icons/VigilIcon";
import { CommerceShell, Price, Availability, ProductLink, num } from "./shared";
import { Picture } from "./ProductPicture";
/** Local mode inspects only supplied records. Host mode reports intent and renders host results unchanged. */
export function CatalogLedger({
  id,
  content,
  treatment,
  binding,
}: { binding?: CatalogBinding } & SectionInstance<"commerce.catalog-ledger">) {
  const { catalog } = content;
  const [local, setLocal] = useState(catalog.selected);
  const query = binding?.query ?? local;
  const canRefine = catalog.scope === "provided-slice" || Boolean(binding);
  const change = (next: CatalogQuery) => {
    if (binding) binding.onQueryChange(next);
    else setLocal(next);
  };
  const rows =
    catalog.scope === "host-results"
      ? content.products
      : content.products.filter((p) =>
          Object.entries(query.filters).every(
            ([key, selected]) =>
              !selected.length ||
              (key === "availability"
                ? selected.includes(p.availability)
                : catalog.filters
                    .find((f) => f.id === key)
                    ?.values.some(
                      (v) => selected.includes(v.id) && v.label === p.category,
                    )),
          ),
        );
  if (catalog.scope === "provided-slice" && query.sort !== "editorial")
    rows.sort(
      (a, b) =>
        (a.price.amountMinor - b.price.amountMinor) *
        (query.sort === "ascending" ? 1 : -1),
    );
  return (
    <CommerceShell id={id} content={content} concept="p02">
      <div className="de-commerce-ledger" aria-busy={binding?.pending ?? false}>
        {catalog.filters.length > 0 && (
          <details className="de-commerce-filters">
            <summary>
              Refine this selection{" "}
              <VigilIcon decorative name="plus" size={16} />
            </summary>
            <div>
              {catalog.filters.map((filter) => (
                <fieldset key={filter.id}>
                  <legend>{filter.label}</legend>
                  {filter.values.map((value) => (
                    <label className="de-commerce-check" key={value.id}>
                      <input
                        type="checkbox"
                        disabled={!canRefine || binding?.pending}
                        checked={
                          query.filters[filter.id]?.includes(value.id) ?? false
                        }
                        onChange={(e) =>
                          change({
                            ...query,
                            filters: {
                              ...query.filters,
                              [filter.id]: e.target.checked
                                ? [
                                    ...(query.filters[filter.id] ?? []),
                                    value.id,
                                  ]
                                : (query.filters[filter.id] ?? []).filter(
                                    (v) => v !== value.id,
                                  ),
                            },
                          })
                        }
                      />
                      {value.label}
                    </label>
                  ))}
                </fieldset>
              ))}
              <label>
                Sort this selection
                <select
                  value={query.sort}
                  disabled={!canRefine || binding?.pending}
                  onChange={(e) => change({ ...query, sort: e.target.value })}
                >
                  {catalog.sorts.map((sort) => (
                    <option key={sort.id} value={sort.id}>
                      {sort.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </details>
        )}
        {!catalog.filters.length && catalog.sorts.length > 1 && (
          <label className="de-commerce-candidate">
            Sort this selection
            <select
              value={query.sort}
              disabled={!canRefine || binding?.pending}
              onChange={(e) => change({ ...query, sort: e.target.value })}
            >
              {catalog.sorts.map((sort) => (
                <option key={sort.id} value={sort.id}>
                  {sort.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="de-commerce-register-labels" aria-hidden="true">
          <span>Object / category</span>
          <span>Availability</span>
          <span>Price / currency</span>
        </div>
        <ul>
          {rows.map((p, i) => (
            <li key={p.productId}>
              <div className="de-commerce-ledger-object">
                <span className="de-commerce-number">{num(i)}</span>
                <Picture
                  media={primaryMedia(p)}
                  compact
                  treatment={treatment}
                />
                <div>
                  <ProductLink product={p}>{p.title}</ProductLink>
                  {p.category && <small>{p.category}</small>}
                </div>
              </div>
              <Availability product={p} />
              <Price product={p} />
            </li>
          ))}
        </ul>
        {!rows.length && (
          <p className="de-commerce-empty">
            No products match this selection. Change the filters to continue.
          </p>
        )}
        <footer>
          <span role="status">
            {binding?.pending
              ? "Updating results…"
              : `${rows.length} shown · ${catalog.scope === "provided-slice" ? content.products.length : catalog.resultCount} ${catalog.scope === "provided-slice" ? "in this selection" : "results"}`}
          </span>
          <small>{content.totalCatalogLabel}</small>
        </footer>
      </div>
    </CommerceShell>
  );
}
