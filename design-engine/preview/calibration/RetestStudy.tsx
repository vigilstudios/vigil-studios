"use client";
import { useState, type CSSProperties } from "react";
import portrait from "@/docs/design-engine/creative-collection-001/assets/portrait-study.jpg";
import chairPortrait from "@/docs/design-engine/creative-calibration-002/assets/metal-chair-portrait.jpg";
import chair from "@/docs/design-engine/creative-calibration-002/assets/metal-chair.jpg";
import coast from "@/docs/design-engine/creative-calibration-002/assets/coastal-architecture.jpg";
import night from "@/docs/design-engine/creative-calibration-002/assets/coastal-architecture-blue-hour.jpg";
import detail from "@/docs/design-engine/creative-calibration-002/assets/coastal-stone-detail.jpg";
import performer from "@/docs/design-engine/creative-calibration-002/assets/stage-performer.jpg";
import { animatedMotion, staticMotion } from "../../registry/capabilities";
import { MediaReveal } from "../../motion/MediaReveal";
import { DesignMedia } from "../../primitives/DesignPrimitives";
import { DesignButton } from "../../primitives/DesignButton";
export const retestStudies = [
  { id: "H09", motionCapability: staticMotion, name: "Object Study", feedback: "Approved: preserve contextual placement and the rounded image relationship.", profiles: ["luxury", "technical", "playful"] },
  { id: "H10", motionCapability: staticMotion, name: "Two Scales", feedback: "Approved: keep elongated media and left-aligned context.", profiles: ["geometric", "editorial", "neo-grotesk"] },
  { id: "H12", motionCapability: staticMotion, name: "Becoming", feedback: "Approved: meaningful visitor-controlled comparison.", profiles: ["humanist", "technical", "poster"] },
  { id: "H13", motionCapability: staticMotion, name: "Type as Terrain", feedback: "Revise: thicker type and substantially more visible photography.", profiles: ["poster", "brutalist", "neo-grotesk"] },
  { id: "H16", motionCapability: animatedMotion, name: "The Vertical Record", feedback: "Approved: preserve media spine; test a left-to-middle image reveal.", profiles: ["fashion", "neo-grotesk", "editorial"] },
] as const;
export type RetestId = (typeof retestStudies)[number]["id"];
export const studyMedia = { chair, coast, night, detail, performer, portrait, chairPortrait };
export function StudyImage({ name, alt = "", className = "" }: { name: keyof typeof studyMedia; alt?: string; className?: string }) {
  return <div className={`study-image ${className}`}><DesignMedia kind="image" src={studyMedia[name].src} alt={alt} /></div>;
}
export function RetestStudy({ id }: { id: RetestId }) {
  const [reveal, setReveal] = useState(50);
  return <section className={`retest retest--${id}`} aria-label={`${id} calibration study`}>
    <div className="study-mast"><span className="de-accent">{id === "H09" ? "Form / Material" : id === "H16" ? "Archive / 1946" : "Material / Practice"}</span><span className="de-mono">Study {id}</span></div>
    {id === "H09" ? <>
      <div className="retest-copy"><p className="de-accent">Collection / No. 001</p><h1 className="de-display">A study in restraint.</h1><p className="de-text">Brushed metal / Edition 01</p></div>
      <StudyImage name="chairPortrait" alt="Sculptural brushed metal chair, framed in a quiet stone room" /><span className="retest-number de-display" aria-hidden="true">01</span>
    </> : null}
    {id === "H10" ? <>
      <div className="retest-copy"><p className="de-accent">Whole / Detail</p><h1 className="de-display">From form to feeling.</h1><p className="de-text">The surface tells the story.</p></div>
      <StudyImage name="coast" alt="Long limestone residence overlooking the coast" /><figure className="retest-detail"><StudyImage name="detail" alt="Close view of the same limestone material" /><figcaption className="de-mono">01 / The stone</figcaption></figure>
    </> : null}
    {id === "H12" ? <>
      <div className="retest-comparison"><StudyImage name="night" alt="Coastal residence with illuminated windows at blue hour" /><div className="retest-before" style={{ clipPath: `inset(0 ${100 - reveal}% 0 0)` }}><StudyImage name="coast" alt="The same coastal residence in daylight" /></div><div className="retest-seam" style={{ left: `${reveal}%` }} aria-hidden="true"><span>↔</span></div></div>
      <div className="retest-copy"><h1 className="de-display">What light can change.</h1><p className="de-text">Compare the same place in daylight and at blue hour.</p><label className="de-accent">Daylight exposure <output>{reveal}%</output><input type="range" min="0" max="100" value={reveal} onChange={(e) => setReveal(Number(e.target.value))} aria-label="Daylight exposure" /></label></div>
    </> : null}
    {id === "H13" ? <>
      <div className="retest-terrain" style={{ "--study-image": `url(${coast.src})` } as CSSProperties}><div className="retest-word de-display" aria-hidden="true">SPACE</div></div>
      <div className="retest-copy"><h1 className="de-heading">Space is possibility.</h1><p className="de-text">A wider photographic field; bold letterforms create a second view into the same scene.</p></div>
    </> : null}
    {id === "H16" ? <>
      <div className="retest-copy"><p className="de-accent">A continuing record</p><h1 className="de-display">A life in motion.</h1><DesignButton href="https://www.figma.com/design/374Ztieuoz4uk6Kv4HmBxy?node-id=2-107">Original study ↗</DesignButton></div>
      <MediaReveal fromX={-60} className="retest-spine"><StudyImage name="performer" alt="Performer extending an arm into a blade of stage light" /></MediaReveal>
      <div className="retest-record de-mono"><p>01 / 04</p><hr className="de-divider" /><p>1946 — First act</p><p>1978 — New stage</p><p>Today — Still moving</p></div>
    </> : null}
  </section>;
}
