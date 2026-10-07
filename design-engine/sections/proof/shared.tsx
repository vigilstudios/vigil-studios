import { SectionActions, ItemAction } from "../../actions/SectionActions";
import { evidencePublicationIssues } from "../../evidence/integrity";
import type { ReactNode } from "react";
import type { EvidenceRecordSource, Testimonial, EvidenceMetric, CaseStudyEvidence } from "../../evidence/types";
export const number = (value:number) => new Intl.NumberFormat("en-US",{maximumFractionDigits:1}).format(value);
export function EvidenceShell({id,content,evidenceMode,concept,children}:{id:string;content:{title:string;introduction:string;eyebrow?:string};evidenceMode:"publication"|"illustrative";concept:string;children:ReactNode}) {
 if(evidenceMode === "publication" && evidencePublicationIssues(content).length) throw new Error("Illustrative evidence requires explicit Lab mode");
 return <section id={id} className={`de-proof de-proof-${concept.toLowerCase()}`} aria-labelledby={`${id}-heading`}>
 {evidenceMode === "illustrative" && <p className="de-proof-disclosure">Design Lab example · fictional evidence and illustrative media</p>}
 <header className="de-proof-intro">{content.eyebrow && <span className="de-proof-eyebrow">{content.eyebrow}</span>}<h2 id={`${id}-heading`}>{content.title}</h2><p>{content.introduction}</p></header>
 {children}<SectionActions/></section>;
}
export function EvidenceSource({ value }: { value: EvidenceRecordSource }) {
  return (
    <details className="de-proof-source">
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
export function Attribution({ value }: { value: Testimonial["author"] }) {
  return (
    <div className="de-proof-attribution">
      <strong>{value.profileUrl ? <a href={value.profileUrl}>{value.name}</a> : value.name}</strong>
      <span>
        {[value.role, value.organization].filter(Boolean).join(" · ")}
      </span>
    </div>
  );
}
export function Voice({
  voice,
  source = true,
}: {
  voice: Testimonial;
  source?: boolean;
}) {
  return (
    <figure className="de-proof-voice">
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
export function Result({ value }: { value: EvidenceMetric }) {
  return (
    <div className="de-proof-result">
      <span className="de-proof-eyebrow">{value.label}</span>
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
export function CaseDestination({value}:{value:CaseStudyEvidence}) {
 return <ItemAction itemId={value.id} fallback={value.destination?.href ? {label:value.destination.label,href:value.destination.href} : undefined} className="de-proof-destination"/>;
}
