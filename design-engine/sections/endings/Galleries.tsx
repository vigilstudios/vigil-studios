"use client";
import { useId, useRef, useState, type CSSProperties } from "react";
import type { SectionInstance } from "../../composition/schemas";
import { ItemAction } from "../../actions/SectionActions";
import { Plate } from "../work/shared";
import { EndingHeading } from "./shared";
import { useMotionPolicy } from "../../motion/MotionPolicy";

export function ExpandRailGallery(section:SectionInstance<"work.expand-rail">) {
  const {content:c}=section,uid=useId(),policy=useMotionPolicy();
  const [selection,setSelection]=useState(section.defaultId??c.works[0].id);
  const active=c.works.some(work=>work.id===selection)?selection:c.works[0].id;
  return <section id={section.id} className="de-ending de-expand" data-layout={section.structure} data-height={section.height} data-rail={section.railWidth} data-motion={section.motion!=="none"&&!policy.reduced} data-surface={section.surface} data-density={section.density} aria-labelledby={`${section.id}-title`} style={{"--de-ending-duration":`${.6*policy.duration}s`} as CSSProperties}><div className="de-ending-inner"><EndingHeading id={section.id} content={c}/><ul className="de-expand-panels">{c.works.map(work=>{
    const open=work.id===active;
    return <li key={work.id} data-open={open}>
      <button type="button" aria-expanded={open} aria-controls={`${uid}-${work.id}`} onPointerEnter={event=>{if(event.pointerType==="mouse")setSelection(work.id);}} onFocus={()=>setSelection(work.id)} onClick={()=>setSelection(work.id)} className="de-expand-trigger"><span>{work.title}</span><span className="de-mono">{work.category}</span></button>
      <div id={`${uid}-${work.id}`} className="de-expand-record" hidden={!open}><Plate image={work.image}/><div className="de-expand-caption">{work.note&&<p className="de-text">{work.note}</p>}<ItemAction group="works" itemId={work.id}/></div></div>
      {section.structure==="image-strips"&&!open&&<div className="de-expand-strip" aria-hidden="true"><Plate image={{...work.image,alt:""}}/></div>}
    </li>;
  })}</ul></div></section>;
}

export function CardRailGallery(section:SectionInstance<"work.card-rail">) {
  const c=section.content,uid=useId(),policy=useMotionPolicy(),rail=useRef<HTMLDivElement>(null),dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement|null>(null);
  const [category,setCategory]=useState<string|null>(null),[selected,setSelected]=useState(c.works[0].id),[inspected,setInspected]=useState(c.works[0].id);
  const categories=[...new Set(c.works.map(work=>work.category))];
  const filter=section.filter==="category"&&category&&categories.includes(category)?category:null;
  const works=c.works.filter(work=>!filter||work.category===filter),index=Math.max(0,works.findIndex(work=>work.id===selected));
  const chosen=works[index],inspection=c.works.find(work=>work.id===inspected)??c.works[0];
  function choose(next:number) {
    const item=works[Math.max(0,Math.min(works.length-1,next))];setSelected(item.id);
    const card=[...(rail.current?.querySelectorAll<HTMLElement>("[data-record]")??[])].find(node=>node.dataset.record===item.id);
    if(card&&rail.current)rail.current.scrollTo({left:card.offsetLeft-(section.structure==="coverflow"?(rail.current.clientWidth-card.clientWidth)/2:0),behavior:section.motion==="none"||policy.reduced?"instant":"smooth"});
  }
  return <section id={section.id} className="de-ending de-card-gallery" data-layout={section.structure} data-ratio={section.ratio} data-motion={section.motion!=="none"&&!policy.reduced} data-surface={section.surface} data-density={section.density} aria-labelledby={`${section.id}-title`} style={{"--de-ending-duration":`${.6*policy.duration}s`} as CSSProperties}><div className="de-ending-inner"><EndingHeading id={section.id} content={c}/>
    {section.filter==="category"&&<div className="de-gallery-controls" role="group" aria-label="Gallery categories"><button type="button" aria-pressed={!filter} onClick={()=>{setCategory(null);setSelected(c.works[0].id);if(rail.current)rail.current.scrollLeft=0;}}>All</button>{categories.map(value=><button type="button" key={value} aria-pressed={filter===value} onClick={()=>{setCategory(value);setSelected(c.works.find(work=>work.category===value)!.id);if(rail.current)rail.current.scrollLeft=0;}}>{value}</button>)}</div>}
    <div ref={rail} className="de-card-track" role="region" aria-label="Image cards" tabIndex={0} onScroll={()=>{
      const host=rail.current;if(!host)return;
      const nodes=[...host.querySelectorAll<HTMLElement>("[data-record]")];
      const distance=(node:HTMLElement)=>Math.abs(node.offsetLeft-(section.structure==="coverflow"?(host.clientWidth-node.clientWidth)/2:0)-host.scrollLeft);
      const nearest=nodes.reduce<HTMLElement|undefined>((best,node)=>!best||distance(node)<distance(best)?node:best,undefined);
      if(nearest?.dataset.record)setSelected(nearest.dataset.record);
    }}>{works.map(work=><article key={work.id} data-record={work.id} data-active={work.id===chosen.id} className="de-gallery-card"><Plate image={work.image}/><div className="de-gallery-card-copy"><p className="de-accent">{work.category}</p><h3 className="de-heading">{work.title}</h3>{work.note&&<p className="de-text">{work.note}</p>}<ItemAction group="works" itemId={work.id}/></div>{section.inspection==="dialog"&&<button type="button" className="de-gallery-inspect" aria-label={`Inspect ${work.title}`} onClick={event=>{opener.current=event.currentTarget;setInspected(work.id);dialog.current?.showModal();}}>Inspect ↗</button>}</article>)}</div>
    <div className="de-gallery-controls"><button type="button" aria-label="Previous image" disabled={index===0} onClick={()=>choose(index-1)}>← Previous</button><p className="de-mono" role="status">{index+1} / {works.length}</p><button type="button" aria-label="Next image" disabled={index===works.length-1} onClick={()=>choose(index+1)}>Next →</button></div>
    {section.inspection==="dialog"&&<dialog className="de-gallery-dialog" ref={dialog} aria-labelledby={`${uid}-inspection`} onClose={()=>opener.current?.focus()}><button type="button" autoFocus onClick={()=>dialog.current?.close()}>Close inspection</button><h3 id={`${uid}-inspection`} className="de-heading">{inspection.title}</h3><Plate image={inspection.image}/>{inspection.note&&<p className="de-text">{inspection.note}</p>}<ItemAction group="works" itemId={inspection.id}/></dialog>}
  </div></section>;
}
