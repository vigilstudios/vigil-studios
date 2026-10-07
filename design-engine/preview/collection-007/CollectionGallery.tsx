"use client";
import { useState, type ReactNode } from "react";
import { collection007Review } from "../../registry/creative-review";
import { LabEditor } from "../editor/LabEditor";
import {
  commerceContexts,
  makeCommerceModel,
  type StressMode,
} from "./fixtures";
import { commerceProposal, commerceStudies } from "./studies";
import { CommerceStudyPreview } from "./Study";

export function CommerceCollectionGallery({
  toolbar,
  workspaceSwitch,
}: {
  toolbar?: ReactNode;
  workspaceSwitch?: ReactNode;
}) {
  const [selected, setSelected] = useState("P01"),
    [adaptation, setAdaptation] = useState(0),
    [device, setDevice] = useState("desktop"),
    [overview, setOverview] = useState(false),
    [tab, setTab] = useState("study"),
    [stress, setStress] = useState<StressMode>("authored");
  const study = commerceStudies.find((s) => s.id === selected)!,
    context = commerceContexts[adaptation];
  const notes = [
    ["Merchandising mechanism", study.dna],
    ["Family / catalog scale", `${study.family} · ${study.scale}`],
    ["Page capability", study.usage],
    ["Content / data contract", study.content],
    ["Media expectations", study.media],
    ["Mobile strategy", study.mobile],
    ["Implemented interaction", study.interaction],
    ["Motion proposal (not implemented)", study.motion],
    ["Composition compatibility", study.compatibility],
    ["Limitations", study.limitations],
    ["Rejected first answer", study.rejected],
    [
      "Authored creative layers",
      `${study.typography[adaptation]} / ${study.art[adaptation]} · all motion none`,
    ],
  ];
  return (
    <LabEditor
      title="Design Lab"
      toolbar={toolbar}
      workspaceSwitch={workspaceSwitch}
      canvasWidth={
        overview
          ? 1440
          : device === "mobile"
            ? 390
            : device === "tablet"
              ? 768
              : 1440
      }
      resetKey={`${selected}-${adaptation}-${device}-${overview}-${stress}`}
      activeTab={tab}
      onTabChange={setTab}
      tabs={[
        {
          id: "study",
          label: "Study",
          content: (
            <>
              <header className="calibration-intro">
                <h2>Collection 007 · Commerce / Product</h2>
                <p>
                  14 creative studies · 42 adaptations. All fourteen concepts
                  approved on 1 October 2026. Productionization is reserved for
                  the next pass.
                </p>
              </header>
              <div className="calibration-controls">
                <label>
                  Commerce study
                  <select
                    aria-label="Commerce study"
                    value={selected}
                    disabled={overview}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    {commerceStudies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} · {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Client adaptation
                  <select
                    aria-label="Commerce client adaptation"
                    value={adaptation}
                    onChange={(e) => setAdaptation(Number(e.target.value))}
                  >
                    {commerceContexts.map((c, i) => (
                      <option key={c.id} value={i}>
                        {c.brand} · {c.context}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Client artboard
                  <select
                    aria-label="Commerce client artboard"
                    disabled={overview}
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                  >
                    <option value="desktop">Desktop · 1440px</option>
                    <option value="tablet">Tablet · 768px</option>
                    <option value="mobile">Mobile · 390px</option>
                  </select>
                </label>
                <label>
                  Content resilience
                  <select
                    aria-label="Commerce content resilience"
                    value={stress}
                    onChange={(e) => setStress(e.target.value as StressMode)}
                  >
                    <option value="authored">Authored fixtures</option>
                    <option value="long-copy">
                      Long product / collection names
                    </option>
                    <option value="no-media">Images unavailable</option>
                  </select>
                </label>
                <button
                  type="button"
                  aria-pressed={overview}
                  onClick={() => setOverview((v) => !v)}
                >
                  {overview
                    ? "Return to selected study"
                    : "Compare fourteen studies"}
                </button>
              </div>
              <div className="c7-notes">
                <h3>
                  {study.id} · {study.name}
                </h3>
                <p>
                  {study.family} · {study.scale}
                </p>
                <p>{study.dna}</p>
                <p>{study.usage}</p>
                <p>
                  {context.brand}: {study.typography[adaptation]} /{" "}
                  {study.art[adaptation]}. Motion none. Product links open local
                  summaries so routes remain host-owned.
                </p>
              </div>
            </>
          ),
        },
        {
          id: "contract",
          label: "Contract",
          content: (
            <div className="c7-notes">
              <h2>
                {study.id} · {study.name}
              </h2>
              <dl>
                {notes.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <details>
                <summary>Study compatibility proposal</summary>
                <pre>{JSON.stringify(commerceProposal(study), null, 2)}</pre>
              </details>
              <details>
                <summary>Validated adaptation payload</summary>
                <pre>
                  {JSON.stringify(
                    makeCommerceModel(study.id, adaptation, stress),
                    null,
                    2,
                  )}
                </pre>
              </details>
              <p>
                Future: Commerce Data Adapter → normalized Vigil product data →
                visual component. No provider SDK, inventory quantity, payment,
                tax, shipping, orders or cart behavior exists here.
              </p>
            </div>
          ),
        },
        {
          id: "review",
          label: "Review",
          content: (
            <div className="c7-notes">
              <h2>Human creative review</h2>
              <p>
                All fourteen concepts passed human creative review on 1 October
                2026. Productionization is reserved for the user’s next pass.
                Registry lifecycle states remain unchanged.
              </p>
              <p>{study.id} · {collection007Review[study.id].status}: {collection007Review[study.id].note}</p>
              <h3>Original first-proof recommendations · all 14 approved</h3>
              {commerceStudies
                .filter((s) => s.shortlist)
                .map((s) => (
                  <section key={s.id}>
                    <h4>
                      {s.id} · {s.name}
                    </h4>
                    <p>{s.shortlist!.why}</p>
                    <p>
                      {s.shortlist!.implementation} {s.shortlist!.responsive}{" "}
                      {s.shortlist!.interaction}
                    </p>
                    <p>Potential: {s.shortlist!.pages}</p>
                  </section>
                ))}
              <h3>Anti-convergence</h3>
              <p>
                The 91-pair dossier compares merchandising, discovery hierarchy,
                media, density, interaction, product information, narrative and
                rhythm. Closest pairs: P01/P05 product edit vs category atlas;
                P06/P07 look membership vs sequential campaign; P08/P10 material
                evidence vs media browsing; P10/P11 selected view vs all-visible
                essay; P07/P14 narrative chapters vs authored companions.
              </p>
              <p>
                The first pass’s second split-screen campaign was replaced with
                P07’s chapter/colophon sequence. P14 was changed from a
                recommendation grid to a relationship-first rail. No score or
                automated creative approval is implied.
              </p>
              <h3>Adaptations</h3>
              <p>
                AFTER HOURS: apparel, model/campaign photography, editorial
                silhouettes, size/color options. morrow: skincare, mixed
                portrait/landscape studio imagery, GBP prices, formula/volume
                options. FORM / FREQUENCY: audio hardware plus a digital
                subscription fixture, technical records, denser assortment,
                configuration/finish options.
              </p>
              <h3>Media / boundaries</h3>
              <p>
                Fictional brands and products. Six new generated studio
                photographs, six generated detail edits and four existing
                generated apparel photographs. Generated detail views are
                explicitly labelled. No claim of measured specifications,
                inventory, ingredient efficacy or provenance.
              </p>
              <p>
                Current engine lacks commerce runtime categories/page types and
                a Product Detail usage role. The study proposals declare these
                locally; extending production contracts requires a separate
                approved phase. No finished pages, page recipes, checkout,
                Shopify integration or dedicated Motion expansion. Scar
                excluded.
              </p>
            </div>
          ),
        },
      ]}
    >
      {overview ? (
        <div className="c7-overview">
          {commerceStudies.map((s) => (
            <article key={s.id}>
              <h3>
                {s.id} · {s.name} / {s.family}
              </h3>
              <div className="c7-overview-stage" inert>
                <CommerceStudyPreview
                  study={s}
                  adaptation={adaptation}
                  stress={stress}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelected(s.id);
                  setOverview(false);
                }}
              >
                Inspect {s.id} · {s.name} ↗
              </button>
            </article>
          ))}
        </div>
      ) : (
        <CommerceStudyPreview
          study={study}
          adaptation={adaptation}
          stress={stress}
        />
      )}
    </LabEditor>
  );
}
