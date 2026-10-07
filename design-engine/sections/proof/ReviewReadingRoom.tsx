"use client";
import { useState } from "react";



import type { SectionPayload } from "../../composition/schemas";
import { EvidenceShell, Voice } from "./shared";


export function ReviewReadingRoom({id,content,evidenceMode}:SectionPayload<"proof.review-reading-room"> & {id:string}) {
const c=content;
  const [source, setSource] = useState("All reviews"),
    n = c.reviews.length,
    average = c.reviews.reduce((a, r) => a + r.rating, 0) / n;
  const selectedSource = source === "All reviews" || c.reviews.some(r=>r.platform === source) ? source : "All reviews";
  const shown = c.reviews.filter(
    (r) => selectedSource === "All reviews" || r.platform === selectedSource,
  );
  return (<EvidenceShell id={id} content={content} evidenceMode={evidenceMode} concept="E07">
    <div className="de-proof-reviews">
      <aside className="de-proof-rating">
        <span className="de-proof-eyebrow">This supplied sample</span>
        <strong>
          {average.toFixed(1)}
          <small> / 5</small>
        </strong>
        <p>{n} supplied reviews · sample average</p>
        <div className="de-proof-distribution">
          {[5, 4, 3, 2, 1].map((r) => {
            const count = c.reviews.filter((v) => v.rating === r).length;
            return (
              <div key={r}>
                <span>{r} of 5</span>
                <i aria-hidden="true">
                  <b style={{ width: `${(count / n) * 100}%` }} />
                </i>
                <span>{count}</span>
              </div>
            );
          })}
        </div>
        <p>{c.selectionPolicy}</p>
      </aside>
      <div className="de-proof-review-journal">
        <div className="de-proof-filters" aria-label="Review source">
          {["All reviews", ...new Set(c.reviews.map((r) => r.platform))].map(
            (s) => (
              <button
                key={s}
                aria-pressed={s === selectedSource}
                onClick={() => setSource(s)}
              >
                {s}
              </button>
            ),
          )}
        </div>
        <p className="de-proof-eyebrow" aria-live="polite">
          Showing {shown.length} of {n} supplied reviews
        </p>
        {shown.map((r, i) => (
          <article
            className="de-proof-review-row"
            key={`${r.author.name}-${r.date}-${i}`}
          >
            <div className="de-proof-review-meta">
              <strong>{r.rating} / 5</strong>
              <time dateTime={r.date}>{r.date}</time>
              <span>{r.platform}</span>
              <span>
                {r.verifiedPurchase
                  ? "Source-verified purchase"
                  : "Purchase not verified"}
              </span>
            </div>
            <Voice voice={r} />
          </article>
        ))}
      </div>
    </div>
  </EvidenceShell>);
}
