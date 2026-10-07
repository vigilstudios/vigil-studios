"use client";
/* eslint-disable @next/next/no-img-element -- Lab-only portable evidence studies use native images and the shared media boundary. */
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { useInView } from "framer-motion";
import { Marquee } from "../../motion/Marquee";
import { FadeReveal } from "../../motion/FadeReveal";
import { useMotionPolicy } from "../../motion/MotionPolicy";
export type ProofMotion = "still" | "live";
import { DesignThemeProvider } from "../../foundations/DesignThemeProvider";
import type { FontBindings } from "../../foundations/typography/types";
import type { SectionImage } from "../../media/types";
import { VigilIcon } from "../../icons/VigilIcon";
import type {
  EvidenceCase,
  Metric,
  ProofContent,
  ProofModel,
  Provenance,
  Testimony,
} from "./contracts";
import { makeProofModel, proofContexts, type StressMode } from "./fixtures";
import type { ProofStudy } from "./studies";
import "./collection.css";
const number = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
export function ProofPicture({
  image,
  label,
}: {
  image?: SectionImage;
  label: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!image || failed)
    return (
      <div className="c8-image-unavailable">
        <VigilIcon name="help" decorative />
        <span>{label}</span>
        <small>Image not available · evidence remains in the text</small>
      </div>
    );
  return (
    <figure className="c8-picture">
      <img
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading="lazy"
        onError={() => setFailed(true)}
      />
      <figcaption>Illustrative image · not a customer record</figcaption>
    </figure>
  );
}
export function EvidenceSource({ value }: { value: Provenance }) {
  return (
    <details className="c8-source">
      <summary>
        {value.status === "demo"
          ? "Demo evidence"
          : value.status === "verified"
            ? "Verification record"
            : "Client-supplied evidence"}{" "}
        <span aria-hidden="true">↗</span>
      </summary>
      <dl>
        <div>
          <dt>Source</dt>
          <dd>{value.source}</dd>
        </div>
        <div>
          <dt>Attribution</dt>
          <dd>{value.attribution}</dd>
        </div>
        <div>
          <dt>Timeframe</dt>
          <dd>{value.timeframe}</dd>
        </div>
        <div>
          <dt>Context</dt>
          <dd>{value.context}</dd>
        </div>
        {value.status === "demo" ? (
          <div>
            <dt>Disclosure</dt>
            <dd>{value.disclosure}</dd>
          </div>
        ) : (
          <>
            <div>
              <dt>Permission</dt>
              <dd>{value.permission}</dd>
            </div>
            <div>
              <dt>Record</dt>
              <dd>{value.recordReference}</dd>
            </div>
            {value.sourceUrl && (
              <div>
                <dt>Original</dt>
                <dd>
                  <a href={value.sourceUrl}>View source</a>
                </dd>
              </div>
            )}
            {value.status === "verified" && (
              <div>
                <dt>Verification</dt>
                <dd>
                  {value.verification.by} · {value.verification.on} ·{" "}
                  {value.verification.method}
                </dd>
              </div>
            )}
          </>
        )}
      </dl>
    </details>
  );
}
function Attribution({ value }: { value: Testimony["author"] }) {
  return (
    <div className="c8-attribution">
      <strong>{value.name}</strong>
      <span>
        {value.role} · {value.organization}
      </span>
    </div>
  );
}
function Voice({
  voice,
  source = true,
}: {
  voice: Testimony;
  source?: boolean;
}) {
  return (
    <figure className="c8-voice">
      <blockquote>
        <p>{voice.quote}</p>
      </blockquote>
      <figcaption>
        <Attribution value={voice.author} />
      </figcaption>
      {source && <EvidenceSource value={voice.provenance} />}
    </figure>
  );
}
function Result({ value }: { value: Metric }) {
  return (
    <div className="c8-result">
      <span className="c8-eyebrow">{value.label}</span>
      <strong>
        {number(value.after)} <small>{value.unit}</small>
      </strong>
      <p>
        Baseline: {number(value.before)} {value.unit}
      </p>
      <p>{value.provenance.timeframe}</p>
    </div>
  );
}
function CaseDestination({ value }: { value: EvidenceCase }) {
  return (
    <details className="c8-destination">
      <summary>
        {value.destination.label} <span aria-hidden="true">↗</span>
      </summary>
      <div>
        <small>
          Local synopsis · {value.destination.kind} / {value.destination.key}
        </small>
        <h3>{value.client}</h3>
        <p>{value.challenge}</p>
        <p>{value.intervention}</p>
        <p>{value.result.basis}</p>
        <p>
          Future destination belongs to the client site. No detail page is
          created.
        </p>
      </div>
    </details>
  );
}
function Equation({ content: c }: { content: ProofContent<"E02"> }) {
  const m = c.result,
    max = Math.max(m.before, m.after, 1),
    delta = m.after - m.before;
  return (
    <div className="c8-equation">
      <div className="c8-equation-values">
        <div>
          <span>Before</span>
          <strong>{number(m.before)}</strong>
          <small>{m.unit}</small>
          <i
            aria-hidden="true"
            style={{ width: `${(m.before / max) * 100}%` }}
          />
        </div>
        <span className="c8-equals-arrow" aria-hidden="true">
          →
        </span>
        <div>
          <span>After</span>
          <strong>{number(m.after)}</strong>
          <small>{m.unit}</small>
          <i
            aria-hidden="true"
            style={{ width: `${(m.after / max) * 100}%` }}
          />
        </div>
      </div>
      <div className="c8-equation-note">
        <h3>{m.label}</h3>
        <p className="c8-delta">
          {delta > 0 ? "+" : ""}
          {number(delta)} {m.unit}
          <br />
          <small>
            {m.before === 0
              ? "Relative change unavailable from a zero baseline"
              : `${number(Math.abs((delta / m.before) * 100))}% ${delta < 0 ? "decrease" : delta > 0 ? "increase" : "change"} from baseline`}
          </small>
        </p>
        <p>{c.explanation}</p>
        <p>{m.basis}</p>
        <EvidenceSource value={m.provenance} />
      </div>
      <Voice voice={c.voice} />
    </div>
  );
}
function Credentials({ content: c }: { content: ProofContent<"E05"> }) {
  const [active, setActive] = useState(0),
    record = c.records[active];
  return (
    <div className="c8-credentials">
      <div className="c8-credential-index" aria-label="Recognition records">
        {c.records.map((r, i) => (
          <button
            key={`${r.title}-${i}`}
            aria-pressed={i === active}
            onClick={() => setActive(i)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            <strong>{r.organization}</strong>
            <small>
              {r.kind} · {r.year}
            </small>
          </button>
        ))}
      </div>
      <article className="c8-accession">
        <p className="c8-eyebrow" aria-live="polite">
          Accession {String(active + 1).padStart(2, "0")} · {record.kind}
        </p>
        <span className="c8-accession-year">{record.year}</span>
        <h3>{record.title}</h3>
        <p>{record.scope}</p>
        <p>
          Issued by {record.organization}
          {record.expires
            ? ` · expires ${record.expires}`
            : " · no expiry supplied"}
        </p>
        <EvidenceSource value={record.provenance} />
      </article>
      <details className="c8-all-records">
        <summary>Read all recognition records</summary>
        {c.records.map((r, i) => (
          <article key={i}>
            <h3>
              {r.organization} · {r.title}
            </h3>
            <p>
              {r.kind} · {r.year}
              {r.expires ? ` · expires ${r.expires}` : ""}
            </p>
            <p>{r.scope}</p>
            <EvidenceSource value={r.provenance} />
          </article>
        ))}
      </details>
    </div>
  );
}
function Reviews({ content: c }: { content: ProofContent<"E07"> }) {
  const [source, setSource] = useState("All reviews"),
    n = c.reviews.length,
    average = c.reviews.reduce((a, r) => a + r.rating, 0) / n;
  const shown = c.reviews.filter(
    (r) => source === "All reviews" || r.platform === source,
  );
  return (
    <div className="c8-reviews">
      <aside className="c8-rating">
        <span className="c8-eyebrow">This supplied demo sample</span>
        <strong>
          {average.toFixed(1)}
          <small> / 5</small>
        </strong>
        <p>{n} fictional reviews · sample average</p>
        <div className="c8-distribution">
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
      <div className="c8-review-journal">
        <div className="c8-filters" aria-label="Review source">
          {["All reviews", ...new Set(c.reviews.map((r) => r.platform))].map(
            (s) => (
              <button
                key={s}
                aria-pressed={s === source}
                onClick={() => setSource(s)}
              >
                {s}
              </button>
            ),
          )}
        </div>
        <p className="c8-eyebrow" aria-live="polite">
          Showing {shown.length} of {n} supplied reviews
        </p>
        {shown.map((r, i) => (
          <article
            className="c8-review-row"
            key={`${r.author.name}-${r.date}-${i}`}
          >
            <div className="c8-review-meta">
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
  );
}
function subscribePageVisibility(notify: () => void) {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
}
function usePageVisible() {
  return useSyncExternalStore(
    subscribePageVisibility,
    () => document.visibilityState === "visible",
    () => true,
  );
}
function VoiceWall({ voices }: { voices: Testimony[] }) {
  return (
    <div className="c8-chorus">
      {voices.map((v, i) => (
        <article key={i} className={`c8-chorus-voice c8-chorus-voice-${i % 4}`}>
          <span className="c8-eyebrow">
            Voice / {String(i + 1).padStart(2, "0")}
          </span>
          {v.portrait && (
            <ProofPicture
              image={v.portrait}
              label="Illustrative human context"
            />
          )}
          <Voice voice={v} />
        </article>
      ))}
    </div>
  );
}
function MovingChorus({
  content,
  motion,
}: {
  content: ProofContent<"E06">;
  motion: ProofMotion;
}) {
  const [paused, setPaused] = useState(false),
    [reading, setReading] = useState(false),
    policy = useMotionPolicy(),
    pageVisible = usePageVisible();
  if (motion === "still" || policy.reduced)
    return (
      <>
        <p className="c8-playback-note">
          {policy.systemReduced
            ? "Reduced motion · all voices remain still"
            : "Still view · all voices and sources"}
        </p>
        <VoiceWall voices={content.voices} />
      </>
    );
  return (
    <div className="c8-loop" data-paused={paused || reading || !pageVisible}>
      <div className="c8-playback">
        <button type="button" onClick={() => setPaused((v) => !v)}>
          {paused ? "Resume moving voices" : "Pause moving voices"}
        </button>
        <p>
          A continuous chorus. Hover to pause; open any voice’s source in the
          complete reading view.
        </p>
      </div>
      <div className="c8-loop-tape" aria-hidden="true">
        <Marquee
          items={content.voices.map(
            (v) =>
              `“${v.quote}” — ${v.author.name}, ${v.author.role} · ${v.author.organization}`,
          )}
          duration={56}
        />
      </div>
      <details
        className="c8-loop-reading"
        onToggle={(e) => setReading(e.currentTarget.open)}
      >
        <summary>Read all {content.voices.length} voices and sources</summary>
        <VoiceWall voices={content.voices} />
      </details>
    </div>
  );
}
function StorySwitchboard({
  content: c,
  motion,
}: {
  content: ProofContent<"E12">;
  motion: ProofMotion;
}) {
  const [active, setActive] = useState(0),
    story = c.stories[active];
  const [playing, setPlaying] = useState(false),
    [hovered, setHovered] = useState(false),
    ref = useRef<HTMLDivElement>(null),
    visible = useInView(ref, { amount: 0.1 }),
    policy = useMotionPolicy(),
    pageVisible = usePageVisible();
  const enabled = motion === "live" && !policy.reduced;
  const running = enabled && playing && visible && pageVisible && !hovered;
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(
      () => setActive((i) => (i + 1) % c.stories.length),
      10000,
    );
    return () => clearInterval(timer);
  }, [running, c.stories.length]);
  return (
    <div ref={ref} className="c8-switchboard" data-sequencing={running}>
      <div className="c8-playback">
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
      <div className="c8-story-index" aria-label="Customer stories">
        {c.stories.map((s, i) => (
          <button
            key={`${s.client}-${i}`}
            aria-pressed={i === active}
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
        className="c8-story-detail"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocusCapture={() => setPlaying(false)}
      >
        <FadeReveal
          key={active}
          distance={0}
          duration={0.35}
          className="c8-story-fade"
        >
          <p className="c8-eyebrow" aria-live={running ? "off" : "polite"}>
            Selected story · {story.client}
          </p>
          <div className="c8-story-scene">
            <ProofPicture
              key={story.media?.src ?? "missing"}
              image={story.media}
              label="Customer context"
            />
            <Result value={story.result} />
          </div>
          <dl className="c8-case-facts">
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
        </FadeReveal>
      </article>
      <details
        className="c8-all-records"
        onToggle={(e) => {
          if (e.currentTarget.open) setPlaying(false);
        }}
      >
        <summary>Read every story summary</summary>
        {c.stories.map((s, i) => (
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
  );
}
function Artwork({
  model,
  motion,
}: {
  model: ProofModel;
  motion: ProofMotion;
}) {
  switch (model.id) {
    case "E01": {
      const c = model.content;
      return (
        <div className="c8-margin">
          <div className="c8-witness">
            <ProofPicture
              image={c.testimony.portrait}
              label="Speaker portrait"
            />
            <Attribution value={c.testimony.author} />
          </div>
          <div className="c8-margin-quote">
            <Voice voice={c.testimony} />
            <p className="c8-margin-note">
              <span aria-hidden="true">↳</span>
              {c.annotation}
            </p>
          </div>
        </div>
      );
    }
    case "E02":
      return <Equation content={model.content} />;
    case "E03": {
      const c = model.content;
      return (
        <div className="c8-dossier">
          <div className="c8-dossier-subject">
            <span className="c8-eyebrow">
              Transformation file / {c.subject}
            </span>
            <p>{c.result.provenance.timeframe}</p>
          </div>
          <ol className="c8-chapters">
            <li className="c8-baseline">
              <span className="c8-chapter-number">01</span>
              <h3>{c.baseline.title}</h3>
              <p>{c.baseline.body}</p>
              {c.baseline.media && (
                <ProofPicture
                  image={c.baseline.media}
                  label="Baseline record"
                />
              )}
              <p className="c8-stage-value">
                {c.result.before}
                <small>{c.result.unit} · baseline</small>
              </p>
            </li>
            <li className="c8-intervention">
              <span className="c8-chapter-number">02</span>
              <h3>{c.intervention.title}</h3>
              <p>{c.intervention.body}</p>
              <p className="c8-eyebrow">{c.intervention.duration}</p>
              <span className="c8-process-arrow" aria-hidden="true">
                ↗
              </span>
            </li>
            <li className="c8-outcome">
              <span className="c8-chapter-number">03</span>
              <h3>{c.outcome.title}</h3>
              {c.outcome.media && (
                <ProofPicture image={c.outcome.media} label="Outcome record" />
              )}
              <p>{c.outcome.body}</p>
              <p className="c8-stage-value">
                {c.result.after}
                <small>{c.result.unit} · outcome</small>
              </p>
            </li>
          </ol>
          <div className="c8-dossier-footer">
            <Voice voice={c.voice} />
            <div>
              <h3>What this evidence covers</h3>
              <p>{c.result.basis}</p>
              <p>{c.limitation}</p>
              <EvidenceSource value={c.result.provenance} />
            </div>
          </div>
        </div>
      );
    }
    case "E04": {
      const c = model.content.case;
      return (
        <div className="c8-cross-section">
          <figure className="c8-case-panorama">
            <ProofPicture image={c.media} label="Project context" />
            <figcaption>
              <span className="c8-eyebrow">{c.client}</span>
              <Result value={c.result} />
            </figcaption>
          </figure>
          <div className="c8-case-footer">
            <dl className="c8-case-facts">
              <div>
                <dt>Challenge</dt>
                <dd>{c.challenge}</dd>
              </div>
              <div>
                <dt>Intervention</dt>
                <dd>{c.intervention}</dd>
              </div>
              <div>
                <dt>Measurement basis</dt>
                <dd>{c.result.basis}</dd>
              </div>
            </dl>
            <Voice voice={c.voice} />
          </div>
          <EvidenceSource value={c.result.provenance} />
          <CaseDestination value={c} />
        </div>
      );
    }
    case "E05":
      return <Credentials content={model.content} />;
    case "E06":
      return <MovingChorus content={model.content} motion={motion} />;
    case "E07":
      return <Reviews content={model.content} />;
    case "E08": {
      const c = model.content;
      return (
        <div className="c8-conversation">
          <div className="c8-interview-scene">
            {c.video ? (
              <video
                controls
                preload="none"
                playsInline
                aria-label={c.video.label}
                poster={c.video.poster.src}
                width={c.video.width}
                height={c.video.height}
              >
                <source src={c.video.src} />
                {c.video.captions && (
                  <track
                    kind="captions"
                    src={c.video.captions.src}
                    srcLang={c.video.captions.language}
                    label={c.video.captions.label}
                  />
                )}
              </video>
            ) : (
              <ProofPicture image={c.still} label="Interview setting" />
            )}
            <div className="c8-interview-credit">
              <Attribution value={c.speaker} />
              <span>
                {c.video
                  ? "Video interview"
                  : "Illustrative still · transcript study"}
              </span>
            </div>
          </div>
          <div className="c8-interview-transcript">
            <span className="c8-eyebrow">
              In conversation / {c.exchanges.length} questions
            </span>
            {c.exchanges.map((e, i) => (
              <details key={i} open={i === 0}>
                <summary>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {e.question}
                </summary>
                <blockquote>
                  <p>{e.answer}</p>
                </blockquote>
              </details>
            ))}
            <details>
              <summary>Read the full transcript</summary>
              {c.video && <p>{c.video.transcript}</p>}
              {c.exchanges.map((e, i) => (
                <section key={i}>
                  <h3>{e.question}</h3>
                  <p>{e.answer}</p>
                </section>
              ))}
            </details>
            <EvidenceSource value={c.provenance} />
          </div>
        </div>
      );
    }
    case "E09": {
      const c = model.content,
        min = Math.min(...c.relationships.map((r) => r.since)),
        max = Math.max(...c.relationships.map((r) => r.through)),
        span = Math.max(max - min, 1);
      return (
        <div className="c8-relationships">
          <div className="c8-relationship-axis" aria-hidden="true">
            <span>Organization / relationship</span>
            <div>
              <span>{min}</span>
              <span>{max}</span>
            </div>
            <span>Scope of relationship</span>
          </div>
          {c.relationships.map((r, i) => (
            <article key={i}>
              <div>
                <h3>{r.organization}</h3>
                <p>{r.role}</p>
              </div>
              <div className="c8-tenure">
                <span>
                  {r.since}–{r.through}
                </span>
                <i
                  aria-hidden="true"
                  style={{
                    marginLeft: `${Math.min(((r.since - min) / span) * 100, 99)}%`,
                    width: `${Math.max(((r.through - r.since) / span) * 100, 1)}%`,
                  }}
                />
              </div>
              <div>
                <p>{r.outcome}</p>
                <EvidenceSource value={r.provenance} />
              </div>
            </article>
          ))}
        </div>
      );
    }
    case "E10": {
      const c = model.content;
      return (
        <div className="c8-progress">
          <div className="c8-progress-method">
            <h3>{c.label}</h3>
            <p>{c.basis}</p>
          </div>
          <ol style={{ "--c8-point-count": c.points.length } as CSSProperties}>
            {c.points.map((p, i) => (
              <li key={p.date} style={{ "--c8-step": i } as CSSProperties}>
                <time dateTime={p.date}>{p.date}</time>
                <strong>
                  {number(p.value)}
                  <small>{c.unit}</small>
                </strong>
                <p>{p.event}</p>
                <EvidenceSource value={p.provenance} />
              </li>
            ))}
          </ol>
        </div>
      );
    }
    case "E11": {
      const c = model.content;
      return (
        <div className="c8-evidence-desk">
          <aside>
            <span className="c8-eyebrow">The claim</span>
            <h3>{c.claim}</h3>
            <p>{c.qualification}</p>
            <span className="c8-exhibit-count">
              {String(c.artifacts.length).padStart(2, "0")}
              <small>supporting exhibits</small>
            </span>
          </aside>
          <ol>
            {c.artifacts.map((a, i) => (
              <li key={i}>
                <span className="c8-eyebrow">
                  Exhibit {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{a.title}</h3>
                <p>{a.finding}</p>
                <details open={i === 0}>
                  <summary>Inspect exhibit {i + 1}</summary>
                  <ProofPicture image={a.media} label="Supporting record" />
                  <EvidenceSource value={a.provenance} />
                </details>
              </li>
            ))}
          </ol>
        </div>
      );
    }
    case "E12":
      return <StorySwitchboard content={model.content} motion={motion} />;
  }
}
export function ProofArtwork({
  model,
  brand,
  motion = "live",
}: {
  model: ProofModel;
  brand: string;
  motion?: ProofMotion;
}) {
  const heading = useId();
  return (
    <section
      className={`c8-study c8-${model.id.toLowerCase()}`}
      data-study={model.id}
      aria-labelledby={heading}
    >
      <div className="c8-colophon">
        <span>{brand}</span>
        <span>Illustrative study · all evidence is fictional</span>
      </div>
      <header className="c8-intro">
        <h2 id={heading}>{model.content.title}</h2>
        <p>{model.content.introduction}</p>
      </header>
      <Artwork model={model} motion={motion} />
      <footer className="c8-footer">
        <span>Collection 008 / {model.id}</span>
        <span>Creative study · awaiting human review</span>
      </footer>
    </section>
  );
}
export function ProofStudyPreview({
  study,
  adaptation = 0,
  stress = "authored",
  fonts,
  motion = "live",
}: {
  study: ProofStudy;
  motion?: ProofMotion;
  adaptation?: number;
  stress?: StressMode;
  fonts?: FontBindings;
}) {
  const c = proofContexts[adaptation];
  return (
    <DesignThemeProvider
      typography={study.typography[adaptation]}
      artDirection={study.art[adaptation]}
      motion={
        motion === "live" && ["E06", "E12"].includes(study.id)
          ? "restrained"
          : "none"
      }
      fonts={fonts}
      overrides={{
        color: {
          background: c.palette[0],
          surface: c.palette[0],
          foreground: c.palette[1],
          muted: c.palette[2],
          accent: c.palette[2],
          border: c.palette[2],
          accentForeground: c.palette[0],
        },
      }}
    >
      <ProofArtwork
        key={`${study.id}-${adaptation}-${stress}-${motion}`}
        model={makeProofModel(study.id, adaptation, stress)}
        brand={c.brand}
        motion={motion}
      />
    </DesignThemeProvider>
  );
}
