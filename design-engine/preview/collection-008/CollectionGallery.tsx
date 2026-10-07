"use client";
import { useState, type ReactNode } from "react";
import { LabEditor } from "../editor/LabEditor";
import { PreviewChoiceControl } from "../PreviewChoiceControl";
import { ProofStudyPreview, type ProofMotion } from "./Study";
import { ProofComposition, proofCompositionContexts } from "./Composition";
import { proofStudies, proofProposal } from "./studies";
import { makeProofModel, proofContexts, type StressMode } from "./fixtures";
import { evidencePublicationIssues, type ProofId } from "./contracts";
type Settings = {
  selected: ProofId;
  adaptation: string;
  width: string;
  stress: StressMode;
  composition: string;
  motion: ProofMotion;
};
export function ProofCollectionGallery({
  toolbar,
  workspaceSwitch,
}: {
  toolbar?: ReactNode;
  workspaceSwitch?: ReactNode;
}) {
  const [settings, setSettings] = useState<Settings>({
    selected: "E01",
    adaptation: "0",
    width: "1440",
    stress: "authored",
    composition: "none",
    motion: "live",
  });
  const [preview, setPreview] = useState<Partial<Settings> | null>(null),
    [overview, setOverview] = useState(false),
    [tab, setTab] = useState("study");
  const current = { ...settings, ...preview },
    study = proofStudies.find((s) => s.id === current.selected)!,
    adaptation = Number(current.adaptation);
  function control(
    key: keyof Settings,
    label: string,
    choices: { value: string; label: string }[],
  ) {
    return (
      <PreviewChoiceControl
        key={key}
        label={label}
        value={settings[key]}
        choices={choices}
        onPreview={(value) => setPreview(value ? { [key]: value } : null)}
        onChange={(value) => {
          setSettings((s) => ({ ...s, [key]: value }));
          setPreview(null);
        }}
      />
    );
  }
  const notes = [
    ["Proof model", study.dna],
    ["Evidence family / scale", `${study.family} · ${study.scale}`],
    ["Content contract", study.content],
    ["Media requirements", study.media],
    ["Section / page capability", study.usage],
    ["Responsive strategy", study.mobile],
    ["Implemented interaction", study.interaction],
    ["Motion behavior / proposal", study.motion],
    ["Accessibility", study.accessibility],
    ["Composition guidance", study.compatibility],
    ["Limitations", study.limitations],
  ];
  const canvas = (value: Settings) => {
    const s = proofStudies.find((s) => s.id === value.selected)!;
    return value.composition === "none" ? (
      <ProofStudyPreview
        study={s}
        adaptation={Number(value.adaptation)}
        stress={value.stress}
        motion={value.motion}
      />
    ) : (
      <ProofComposition
        study={s}
        adaptation={Number(value.adaptation)}
        stress={value.stress}
        motion={value.motion}
        contextIndex={Number(value.composition)}
      />
    );
  };
  return (
    <LabEditor
      title="Design Lab"
      toolbar={toolbar}
      workspaceSwitch={workspaceSwitch}
      viewportControl={control(
        "width",
        "Proof artboard",
        [1440, 1024, 768, 390, 320].map((w) => ({
          value: String(w),
          label: `${w}px`,
        })),
      )}
      canvasWidth={overview ? 1440 : Number(current.width)}
      resetKey={`${settings.selected}-${settings.adaptation}-${settings.width}-${settings.composition}-${overview}`}
      activeTab={tab}
      onTabChange={(v) => {
        setTab(v);
        setPreview(null);
      }}
      tabs={[
        {
          id: "study",
          label: "Study",
          content: (
            <>
              <header className="calibration-intro">
                <h2>Collection 008 · Social Proof / Results</h2>
                <p>
                  12 studies · 36 unrelated adaptations. Awaiting human creative
                  review. All displayed evidence is fictional.
                </p>
              </header>
              <div className="c8-controls">
                {control(
                  "selected",
                  "Proof study",
                  proofStudies.map((s) => ({
                    value: s.id,
                    label: `${s.id} · ${s.name}`,
                  })),
                )}
                {control(
                  "adaptation",
                  "Proof client adaptation",
                  proofContexts.map((c, i) => ({
                    value: String(i),
                    label: `${c.brand} · ${c.context}`,
                  })),
                )}
                {control("stress", "Evidence resilience", [
                  { value: "authored", label: "Authored evidence" },
                  { value: "long-copy", label: "Long quotations and answers" },
                  { value: "no-media", label: "Media not supplied" },
                ])}
                {["E06", "E12"].includes(current.selected) &&
                  control("motion", "Proof motion", [
                    {
                      value: "live",
                      label:
                        current.selected === "E06"
                          ? "Moving voices · slow loop"
                          : "Story sequence · visitor starts",
                    },
                    { value: "still", label: "Still · manual reading" },
                  ])}
                {control("composition", "Production composition", [
                  { value: "none", label: "Study alone" },
                  ...proofCompositionContexts.map((c, i) => ({
                    value: String(i),
                    label: c.name,
                  })),
                ])}
                <button
                  type="button"
                  aria-pressed={overview}
                  onClick={() => {
                    setPreview(null);
                    setOverview((v) => !v);
                  }}
                >
                  {overview
                    ? "Return to selected study"
                    : "Compare twelve studies"}
                </button>
              </div>
              <div className="c8-notes">
                <h3>
                  {study.id} · {study.name}
                </h3>
                <p>{study.dna}</p>
                <p>
                  {study.scale} · {study.usage}
                </p>
                <p>
                  {study.typography[adaptation]} / {study.art[adaptation]} ·
                  {["E06", "E12"].includes(study.id)
                    ? `${current.motion} motion treatment`
                    : "motion none"}
                </p>
                <p>
                  Hover or focus a choice to audition it. Escape restores the
                  authored canvas and its interaction state.
                </p>
              </div>
            </>
          ),
        },
        {
          id: "contract",
          label: "Contract",
          content: (
            <div className="c8-notes">
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
                <summary>Study capability proposal</summary>
                <pre>{JSON.stringify(proofProposal(study), null, 2)}</pre>
              </details>
              <details>
                <summary>Validated evidence payload</summary>
                <pre>
                  {JSON.stringify(
                    makeProofModel(study.id, adaptation, current.stress),
                    null,
                    2,
                  )}
                </pre>
              </details>
              <p>
                {
                  evidencePublicationIssues(
                    makeProofModel(study.id, adaptation),
                  ).length
                }{" "}
                demo evidence records flagged by the proposed publication
                preflight. A declaration of verification is not independent
                verification.
              </p>
            </div>
          ),
        },
        {
          id: "review",
          label: "Review",
          content: (
            <div className="c8-notes">
              <h2>Human review remains authoritative</h2>
              <p>
                All twelve studies are awaiting review. No registry promotion,
                production implementation or approval is inferred.
              </p>
              <h3>First production-proof recommendations</h3>
              {proofStudies
                .filter((s) => s.shortlist)
                .map((s) => (
                  <section key={s.id}>
                    <h3>
                      {s.id} · {s.name}
                    </h3>
                    <p>{s.shortlist!.why}</p>
                    <p>Content: {s.content}</p>
                    <p>
                      {s.shortlist!.implementation} {s.shortlist!.responsive}{" "}
                      {s.shortlist!.interaction}
                    </p>
                    <p>Potential: {s.shortlist!.pages}</p>
                  </section>
                ))}
              <h3>Three different briefs</h3>
              <p>
                BOUNDARY / PRACTICE: synthetic triage measurements, ownership
                diagrams and a larger relationship register. EVERYDAY STRONG:
                attendance and first-person consistency, more community voices,
                no health or body-change claim. STILL / FORM: retained
                inventory, repair decisions and material imagery, with fewer
                customer stories and more recognition records.
              </p>
              <h3>Closest concept pairs</h3>
              <p>
                E01/E06: one sustained voice versus an all-visible chorus.
                E02/E10: endpoint arithmetic versus dated observations. E03/E04:
                complete change process versus a condensed project result.
                E04/E12: one case versus customer-story discovery. E05/E11:
                independent recognition versus supporting exhibits. E06/E07:
                qualitative experiences versus an explicitly bounded review
                sample.
              </p>
              <h3>Boundaries</h3>
              <p>
                Source records, human consent, real media, review ingestion,
                destination resolution and independent verification belong to a
                later approved implementation. No finished pages, page recipes,
                new Motion system or Collection 009.
              </p>
            </div>
          ),
        },
      ]}
    >
      {overview ? (
        <div className="c8-overview">
          {proofStudies.map((s) => (
            <article key={s.id}>
              <h3>
                {s.id} · {s.name}
              </h3>
              <div className="c8-overview-stage" inert>
                <ProofStudyPreview
                  study={s}
                  adaptation={adaptation}
                  motion="still"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSettings((v) => ({ ...v, selected: s.id }));
                  setOverview(false);
                }}
              >
                Inspect {s.id} · {s.name}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <>
          <div
            className="c8-retained"
            aria-hidden={preview ? true : undefined}
            inert={preview ? true : undefined}
            style={{ width: Number(settings.width) }}
          >
            {canvas(settings)}
          </div>
          {preview && (
            <div className="c8-audition" inert>
              {canvas(current)}
            </div>
          )}
        </>
      )}
    </LabEditor>
  );
}
