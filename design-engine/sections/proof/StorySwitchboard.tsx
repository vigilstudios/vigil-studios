"use client";
import { useState, useRef, useEffect } from "react";
import { useInView } from "framer-motion";
import { useMotionPolicy } from "../../motion/MotionPolicy";
import { usePageVisible } from "../../motion/visibility";
import type { SectionPayload } from "../../composition/schemas";
import { EvidenceShell, Voice, Result, EvidenceSource, CaseDestination } from "./shared";
import { EvidenceMediaReveal } from "./EvidenceMediaReveal";
import { EvidenceReveal } from "./EvidenceReveal";
export function StorySwitchboard({id,content,motion,evidenceMode}:SectionPayload<"proof.story-switchboard"> & {id:string}) {
  const [active, setActive] = useState(0),
    selected = Math.min(active,content.stories.length-1),
    story = content.stories[selected];
  const [playing, setPlaying] = useState(false),
    [hovered, setHovered] = useState(false),
    ref = useRef<HTMLDivElement>(null),
    visible = useInView(ref, { amount: 0.1 }),
    policy = useMotionPolicy(),
    pageVisible = usePageVisible();
  const enabled = motion === "fade" && !policy.reduced;
  const running = enabled && playing && visible && pageVisible && !hovered;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () => setActive((i) => (i + 1) % content.stories.length),
      10000,
    );
    return () => clearInterval(timer);
  }, [running, content.stories.length]);
  return (<EvidenceShell id={id} content={content} evidenceMode={evidenceMode} concept="E12">
    <div ref={ref} className="de-proof-switchboard" data-sequencing={running}>
      <div className="de-proof-playback">
        {enabled ? (
          <button type="button" onClick={() => setPlaying((v) => !v)}>
            {playing ? "Pause stories" : "Play stories"}
          </button>
        ) : null}
        <p>
          {policy.systemReduced
            ? "Reduced motion · select a story to read"
            : enabled
              ? "Visitor-started sequence · 10 seconds per story. Hover to pause; keyboard focus or manual selection stops playback."
              : "Still view · select a story to read"}
        </p>
      </div>
      <div className="de-proof-story-index" aria-label="Customer stories">
        {content.stories.map((s, i) => (
          <button
            key={`${s.client}-${i}`}
            aria-pressed={i === selected}
            onFocus={() => setPlaying(false)}
            onClick={() => {
              setPlaying(false);
              setActive(i);
            }}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            <strong>{s.client}</strong>
            <small>
              {s.result.label}: {s.result.after} {s.result.unit}
            </small>
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <article
        className="de-proof-story-detail"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocusCapture={() => setPlaying(false)}
      >
        <EvidenceReveal key={story.id} motion={motion}>
          <p className="de-proof-eyebrow" aria-live={running ? "off" : "polite"}>
            Selected story · {story.client}
          </p>
          <div className="de-proof-story-scene">
            <EvidenceMediaReveal
              key={story.media?.src ?? "missing"}
              image={story.media}
              label="Customer context"
            />
            <Result value={story.result} />
          </div>
          <dl className="de-proof-case-facts">
            <div>
              <dt>Challenge</dt>
              <dd>{story.challenge}</dd>
            </div>
            <div>
              <dt>Intervention</dt>
              <dd>{story.intervention}</dd>
            </div>
          </dl>
          <Voice voice={story.voice} />
          <EvidenceSource value={story.result.provenance} />
          <CaseDestination value={story} />
        </EvidenceReveal>
      </article>
      <details
        className="de-proof-all-records"
        onToggle={(e) => {
          if (e.currentTarget.open) setPlaying(false);
        }}
      >
        <summary>Read every story summary</summary>
        {content.stories.map((s, i) => (
          <article key={i}>
            <h3>{s.client}</h3>
            <p>{s.challenge}</p>
            <p>{s.intervention}</p>
            <Result value={s.result} />
            <p>{s.result.basis}</p>
            <Voice voice={s.voice} />
            <EvidenceSource value={s.result.provenance} />
            <CaseDestination value={s} />
          </article>
        ))}
      </details>
    </div>
  </EvidenceShell>);
}
