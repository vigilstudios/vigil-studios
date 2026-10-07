
import type { SectionPayload } from "../../composition/schemas";
import { EvidenceShell, Attribution, EvidenceSource } from "./shared";
import { EvidenceMediaReveal } from "./EvidenceMediaReveal";


export function InConversation({id,content,motion,evidenceMode}:SectionPayload<"proof.in-conversation"> & {id:string}) {
const c = content;
      return (<EvidenceShell id={id} content={content} evidenceMode={evidenceMode} concept="E08">
        <div className="de-proof-conversation">
          <div className="de-proof-interview-scene">
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
              <EvidenceMediaReveal image={c.still} motion={motion} label="Interview setting" />
            )}
            <div className="de-proof-interview-credit">
              <Attribution value={c.speaker} />
              <span>
                {c.video
                  ? "Video interview"
                  : "Interview transcript"}
              </span>
            </div>
          </div>
          <div className="de-proof-interview-transcript">
            <span className="de-proof-eyebrow">
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
      </EvidenceShell>);
}
