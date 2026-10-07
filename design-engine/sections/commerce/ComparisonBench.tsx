"use client";
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { primaryMedia } from "../../commerce/presentation";
import { CommerceShell, ProductRecord } from "./shared";
import { Picture } from "./ProductPicture";
export function ComparisonBench({
  id,
  content,
  treatment,
}: SectionInstance<"commerce.comparison-bench">) {
  const [candidate, setCandidate] = useState(1),
    a = content.products[0],
    b = content.products[Math.min(candidate, content.products.length - 1)];
  const artwork = (
    <div className="de-commerce-bench">
      <label className="de-commerce-candidate">
        Compare {a.title} with
        <select
          value={candidate}
          onChange={(e) => setCandidate(Number(e.target.value))}
        >
          {content.products.slice(1).map((p, i) => (
            <option key={p.productId} value={i + 1}>
              {p.title}
            </option>
          ))}
        </select>
      </label>
      <p className="de-commerce-sr-only" role="status">
        Comparing {a.title} and {b.title}
      </p>
      <div className="de-commerce-bench-objects">
        {[a, b].map((p, i) => (
          <article key={p.productId}>
            <small>{i === 0 ? "Baseline" : "Candidate"}</small>
            <Picture
              treatment={treatment}
              key={p.productId}
              media={primaryMedia(p)}
            />
            <ProductRecord product={p} />
          </article>
        ))}
      </div>
      <table>
        <caption>Shared criteria · authored product comparison</caption>
        <thead>
          <tr>
            <th scope="col">Criterion</th>
            <th scope="col">{a.title}</th>
            <th scope="col">{b.title}</th>
          </tr>
        </thead>
        <tbody>
          {content.criteria.map((c) => (
            <tr key={c.id}>
              <th scope="row">{c.label}</th>
              <td>{c.values[a.productId]}</td>
              <td>{c.values[b.productId]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <CommerceShell id={id} content={content} concept="p13">
      {artwork}
    </CommerceShell>
  );
}
