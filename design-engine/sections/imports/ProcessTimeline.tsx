"use client";
import { useEffect, useRef, useState } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { useMotionPolicy } from "../../motion/MotionPolicy";
import { ItemAction } from "../../actions/SectionActions";
import { Plate } from "../work/shared";
import { ImportHeading } from "./shared";
/** Measured local track; no hard-coded years or global selectors/listeners. */
export function ProcessTimeline({id,content,structure,motion,density,surface}:SectionInstance<"story.process-timeline">) {
 const host=useRef<HTMLElement>(null),track=useRef<HTMLDivElement>(null),sticky=useRef<HTMLDivElement>(null),policy=useMotionPolicy(),[reading,setReading]=useState(false);
 const enabled=!policy.reduced && motion !== "none" && !reading;
 useEffect(()=>{
  const section=host.current,rail=track.current,pin=sticky.current;
  if(!section || !rail || !pin || !enabled)return;
  let frame=0,disposed=false;
  let scrollHost:HTMLElement|Window=window;
  for(let parent=section.parentElement;parent;parent=parent.parentElement) {if(/auto|scroll/.test(getComputedStyle(parent).overflowY)){scrollHost=parent;break;}}
  const update=()=>{
   frame=0;if(disposed)return;
   const viewHeight=scrollHost===window?window.innerHeight:(scrollHost as HTMLElement).clientHeight;
   const heading=section.querySelector<HTMLElement>(".de-import-heading");
   const tallest=Math.max(...Array.from(rail.querySelectorAll<HTMLElement>("article")).map(n=>n.offsetHeight));
   const wide=section.clientWidth>=760 && (heading?.offsetHeight??0)+tallest*2+128<=viewHeight;
   section.dataset.pinned=String(wide);
   const overflow=Math.max(0,rail.scrollWidth-pin.clientWidth);
   section.style.setProperty("--de-timeline-travel",`${wide?overflow:0}px`);
   const top=scrollHost===window?0:(scrollHost as HTMLElement).getBoundingClientRect().top;
   const distance=Math.max(0,Math.min(overflow,top-section.getBoundingClientRect().top));
   rail.style.transform=wide?`translate3d(${-distance}px,0,0)`:"";
   rail.style.setProperty("--de-timeline-progress",`${overflow?distance/overflow:1}`);
   rail.querySelectorAll<HTMLElement>(".de-timeline-stations li").forEach(node=>{
    const reveal=wide ? Math.max(0,Math.min(1,(pin.clientWidth-node.offsetLeft+distance)/Math.min(pin.clientWidth,400))) : 1;
    node.style.setProperty("--de-station-reveal",String(reveal));
    const article=node.querySelector<HTMLElement>("article");if(article){article.style.transform=`translateY(${(1-reveal)*18*policy.distance}px)`;article.style.opacity=String(.4+.6*reveal);}
   });
  };
  const queue=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const resize=new ResizeObserver(queue);resize.observe(section);resize.observe(rail);resize.observe(pin);
  scrollHost.addEventListener("scroll",queue,{passive:true});window.addEventListener("resize",queue);
  document.fonts.ready.then(()=>{if(!disposed)queue();});queue();
  return ()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();scrollHost.removeEventListener("scroll",queue);window.removeEventListener("resize",queue);section.dataset.pinned="false";section.style.removeProperty("--de-timeline-travel");rail.style.transform="";rail.querySelectorAll<HTMLElement>("article").forEach(n=>{n.style.transform="";n.style.opacity="";});};
 },[enabled,content.steps.length,structure,density,policy.distance]);
 const steps=<ol className="de-timeline-stations">{content.steps.map((step,i)=><li key={step.id}><span className="de-timeline-dot" aria-hidden="true"/><article><p className="de-mono">{step.label} / {String(i+1).padStart(2,"0")}</p><h3 className="de-heading">{step.title}</h3><p className="de-text">{step.body}</p><ItemAction group="steps" itemId={step.id}/></article></li>)}</ol>;
 return <section ref={host} id={id} className="de-import de-process-timeline" data-structure={structure} data-density={density} data-surface={surface} data-pinned="false" aria-labelledby={`${id}-title`} onFocusCapture={e=>{if((e.target as Element).closest(".de-timeline-stations"))setReading(true);}}>
 <div ref={sticky} className="de-timeline-pin"><ImportHeading id={id} content={content}>{content.period&&<p className="de-mono">{content.period}</p>}<button type="button" className="de-timeline-read" aria-pressed={reading} onClick={()=>setReading(v=>!v)}>{reading?"Return to timeline":"Read all steps without scrolling"}</button></ImportHeading>
 <div ref={track} className="de-timeline-track">{content.image&&<figure className="de-timeline-opening"><Plate image={content.image}/></figure>}{steps}</div></div></section>;
}
