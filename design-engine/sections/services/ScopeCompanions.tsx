"use client";
// Preserves the reviewed mechanism; client content and destinations enter through props.
import { useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { ServiceShell, ServiceLink } from "./shared";
export function ScopeCompanions({
  id,
  content,
  initialBaselineId,
  initialCandidateId,
}: SectionInstance<"services.scope-companions">) {
  const [a, setBaseline] = useState(
    initialBaselineId ?? content.offerings[0].id,
  );
  const [b, setCandidate] = useState(
    initialCandidateId ?? content.offerings[1].id,
  );
  const baseline = Math.max(
      content.offerings.findIndex((item) => item.id === a),
      0,
    ),
    candidate = Math.max(
      content.offerings.findIndex((item) => item.id === b),
      0,
    );
  const { offerings, criteria } = content;
  const artwork = (
    <div className="de-service-scopes">
      <div className="de-service-mobile-only de-service-scope-selectors">
        {(
          [
            ["Baseline", baseline, setBaseline],
            ["Compare with", candidate, setCandidate],
          ] as const
        ).map(([label, value, set]) => (
          <label key={label}>
            {label}
            <select
              value={offerings[value].id}
              onChange={(e) => set(e.target.value)}
            >
              {offerings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <table className="de-service-desktop-only">
        <caption>Compare the scope of each offering</caption>
        <thead>
          <tr>
            <th scope="col">A shared question</th>
            {offerings.map((o) => (
              <th scope="col" key={o.id}>
                {o.title}
                <small>{o.bestFor}</small>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {criteria.map((c, i) => (
            <tr key={c}>
              <th scope="row">{c}</th>
              {offerings.map((o) => (
                <td key={o.id}>{o.values[i]}</td>
              ))}
            </tr>
          ))}
          <tr>
            <th scope="row">Boundary</th>
            {offerings.map((o) => (
              <td key={o.id}>{o.boundary}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">Explore</th>
            {offerings.map((o) => (
              <td key={o.id}>{<ServiceLink itemId={o.id} destination={o.detail} />}</td>
            ))}
          </tr>
        </tbody>
      </table>
      <div className="de-service-mobile-only">
        <p aria-live="polite">
          {baseline === candidate
            ? `Both columns show ${offerings[baseline].title}`
            : `${offerings[baseline].title} compared with ${offerings[candidate].title}`}
        </p>
        <dl className="de-service-scope-pairs">
          {[
            [
              "Best for",
              offerings[baseline].bestFor,
              offerings[candidate].bestFor,
            ],
            ...criteria.map((c, i) => [
              c,
              offerings[baseline].values[i],
              offerings[candidate].values[i],
            ]),
            [
              "Boundary",
              offerings[baseline].boundary,
              offerings[candidate].boundary,
            ],
          ].map(([label, a, b]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                <span>
                  <small>{offerings[baseline].title}</small>
                  {a}
                </span>
                <span>
                  <small>{offerings[candidate].title}</small>
                  {b}
                </span>
              </dd>
            </div>
          ))}
        </dl>
        <div className="de-service-scope-links">
          {[baseline, candidate].map((i, j) => (
            <div key={j}>
              {<ServiceLink itemId={offerings[i].id} destination={offerings[i].detail} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  return (
    <ServiceShell id={id} content={content} concept="c12">
      {artwork}
    </ServiceShell>
  );
}
