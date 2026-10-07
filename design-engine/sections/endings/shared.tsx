"use client";
import type { ReactNode } from "react";
import type { DestinationRecord } from "../../composition/ending-schemas";
import { useActionResolution } from "../../actions/ActionContext";
import { SectionActions } from "../../actions/SectionActions";
import { DesignButton } from "../../primitives/DesignButton";
import { FadeReveal } from "../../motion/FadeReveal";
export function DestinationLink({record}:{record:DestinationRecord}) {
  const resolution=useActionResolution({enabled:true,label:record.title,action:record.destination});
  return <DesignButton href={resolution?.href} unavailable={resolution?.issue} download={resolution?.download} presentation={{variant:"text",size:"small"}}>{record.title}</DesignButton>;
}
export function EndingHeading({id,content,actions=true}:{id:string;content:{title:string;introduction:string;eyebrow?:string};actions?:boolean}) {
  return <header className="de-ending-heading">{content.eyebrow&&<p className="de-accent">{content.eyebrow}</p>}<h2 id={`${id}-title`} className="de-display">{content.title}</h2><p className="de-text de-text--lead">{content.introduction}</p>{actions&&<SectionActions/>}</header>;
}
export function EndingReveal({motion,children}:{motion:string;children:ReactNode}) {
  return motion==="fade"?<FadeReveal>{children}</FadeReveal>:<>{children}</>;
}
export function DestinationList({items,label}:{items:DestinationRecord[];label:string}) {
  return items.length?<nav aria-label={label}><ul className="de-ending-destinations">{items.map(record=><li key={record.id}><DestinationLink record={record}/>{record.note&&<p className="de-text de-text--small">{record.note}</p>}</li>)}</ul></nav>:null;
}
